import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { AdaptiveSourcePersistentState, AdaptiveSourceOutcome } from '@/lib/intelligence/adaptive-source-crawl';

export type SourceHealthLearningStatus={
  configured:boolean;enabled:boolean;schemaReady:boolean;loadedSources:number;savedSources:number;
  mode:'disabled'|'database';reason:string|null;
};

function enabledByConfig(){return process.env.BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED==='true';}
function disabled(reason:string,configured=false):SourceHealthLearningStatus{
  return {configured,enabled:false,schemaReady:false,loadedSources:0,savedSources:0,mode:'disabled',reason};
}

export async function loadPersistentSourceHealth(limit=500):Promise<{status:SourceHealthLearningStatus;rows:AdaptiveSourcePersistentState[]}>{
  if(!enabledByConfig())return {status:disabled('BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED är inte true. Persistent source health learning är avstängt.'),rows:[]};
  if(!getDatabase())return {status:disabled('DATABASE_URL saknas.',true),rows:[]};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return {status:disabled('Databasanslutning saknas.',true),rows:[]};
    await sql`select 1 from intelligence_source_health_learning limit 1`;
    const rows=await sql`
      select source_id,runs,ok_runs,total_candidates,total_unseen,total_primary,total_confirmations,total_tier_a,total_tier_b,empty_runs,last_run_at
      from intelligence_source_health_learning
      where organization_id=${organizationId}::uuid
      order by last_run_at desc
      limit ${Math.max(1,Math.min(2000,Math.floor(limit)))}
    `;
    const mapped:AdaptiveSourcePersistentState[]=(rows as any[]).map(row=>({
      sourceId:String(row.source_id),runs:Number(row.runs??0),okRuns:Number(row.ok_runs??0),
      totalCandidates:Number(row.total_candidates??0),totalUnseen:Number(row.total_unseen??0),
      totalPrimary:Number(row.total_primary??0),totalConfirmations:Number(row.total_confirmations??0),
      totalTierA:Number(row.total_tier_a??0),totalTierB:Number(row.total_tier_b??0),emptyRuns:Number(row.empty_runs??0),
      lastRunAt:new Date(row.last_run_at).toISOString(),
    }));
    return {status:{configured:true,enabled:true,schemaReady:true,loadedSources:mapped.length,savedSources:0,mode:'database',reason:null},rows:mapped};
  }catch(error){return {status:disabled(databaseErrorMessage(error),true),rows:[]};}
}

export async function persistSourceHealthOutcomes(outcomes:AdaptiveSourceOutcome[], observedAt:string):Promise<SourceHealthLearningStatus>{
  if(!enabledByConfig())return disabled('BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED är inte true. Persistent source health learning är avstängt.');
  if(!getDatabase())return disabled('DATABASE_URL saknas.',true);
  if(!outcomes.length)return {configured:true,enabled:true,schemaReady:true,loadedSources:0,savedSources:0,mode:'database',reason:null};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return disabled('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_source_health_learning limit 1`;
    let saved=0;
    for(const o of outcomes){
      await sql`
        insert into intelligence_source_health_learning (
          organization_id,source_id,runs,ok_runs,total_candidates,total_unseen,total_primary,total_confirmations,total_tier_a,total_tier_b,empty_runs,first_run_at,last_run_at
        ) values (
          ${organizationId}::uuid,${o.sourceId},1,${o.ok?1:0},${o.candidates},${o.unseen},${o.acceptedPrimary},${o.confirmations},${o.tierA},${o.tierB},${o.ok&&o.candidates===0?1:0},${observedAt}::timestamptz,${observedAt}::timestamptz
        )
        on conflict (organization_id,source_id) do update set
          runs=intelligence_source_health_learning.runs+1,
          ok_runs=intelligence_source_health_learning.ok_runs+excluded.ok_runs,
          total_candidates=intelligence_source_health_learning.total_candidates+excluded.total_candidates,
          total_unseen=intelligence_source_health_learning.total_unseen+excluded.total_unseen,
          total_primary=intelligence_source_health_learning.total_primary+excluded.total_primary,
          total_confirmations=intelligence_source_health_learning.total_confirmations+excluded.total_confirmations,
          total_tier_a=intelligence_source_health_learning.total_tier_a+excluded.total_tier_a,
          total_tier_b=intelligence_source_health_learning.total_tier_b+excluded.total_tier_b,
          empty_runs=intelligence_source_health_learning.empty_runs+excluded.empty_runs,
          last_run_at=greatest(intelligence_source_health_learning.last_run_at,excluded.last_run_at)
      `;
      await sql`
        update intelligence_source_health_learning set
          runs=ceil(runs*.72)::int,ok_runs=ceil(ok_runs*.72)::int,total_candidates=ceil(total_candidates*.72)::int,
          total_unseen=ceil(total_unseen*.72)::int,total_primary=ceil(total_primary*.72)::int,total_confirmations=ceil(total_confirmations*.72)::int,
          total_tier_a=ceil(total_tier_a*.72)::int,total_tier_b=ceil(total_tier_b*.72)::int,empty_runs=ceil(empty_runs*.72)::int
        where organization_id=${organizationId}::uuid and source_id=${o.sourceId} and runs>=24
      `;
      saved++;
    }
    return {configured:true,enabled:true,schemaReady:true,loadedSources:0,savedSources:saved,mode:'database',reason:null};
  }catch(error){return disabled(databaseErrorMessage(error),true);}
}
