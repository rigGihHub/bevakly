import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { GapFeedbackObservation, GapFeedbackPersistentState } from '@/lib/intelligence/discovery-feedback-loop';

export type DiscoveryLearningPersistenceStatus={
  configured:boolean;
  enabled:boolean;
  schemaReady:boolean;
  loadedPatterns:number;
  savedObservations:number;
  mode:'disabled'|'database';
  reason:string|null;
};

function enabledByConfig(){
  return process.env.BEVAKLY_DISCOVERY_LEARNING_ENABLED==='true';
}

function disabled(reason:string,configured=false):DiscoveryLearningPersistenceStatus{
  return {configured,enabled:false,schemaReady:false,loadedPatterns:0,savedObservations:0,mode:'disabled',reason};
}

export async function loadPersistentDiscoveryLearning(limit=200):Promise<{status:DiscoveryLearningPersistenceStatus;rows:GapFeedbackPersistentState[]}>{
  if(!enabledByConfig())return {status:disabled('BEVAKLY_DISCOVERY_LEARNING_ENABLED är inte true. Persistent discovery learning är avstängt.',false),rows:[]};
  if(!getDatabase())return {status:disabled('DATABASE_URL saknas.',true),rows:[]};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return {status:disabled('Databasanslutning saknas.',true),rows:[]};
    await sql`select 1 from intelligence_discovery_learning limit 1`;
    const rows=await sql`
      select pattern_key,runs,attempted,accepted,high_fact,high_score,empty_runs,last_observed_at
      from intelligence_discovery_learning
      where organization_id=${organizationId}::uuid
      order by last_observed_at desc
      limit ${Math.max(1,Math.min(1000,Math.floor(limit)))}
    `;
    const mapped:GapFeedbackPersistentState[]=(rows as any[]).map(row=>({
      key:String(row.pattern_key),
      runs:Number(row.runs??0),
      attempted:Number(row.attempted??0),
      accepted:Number(row.accepted??0),
      highFact:Number(row.high_fact??0),
      highScore:Number(row.high_score??0),
      emptyRuns:Number(row.empty_runs??0),
      lastObservedAt:new Date(row.last_observed_at).toISOString(),
    }));
    return {
      status:{configured:true,enabled:true,schemaReady:true,loadedPatterns:mapped.length,savedObservations:0,mode:'database',reason:null},
      rows:mapped,
    };
  }catch(error){
    return {status:disabled(databaseErrorMessage(error),true),rows:[]};
  }
}

export async function persistDiscoveryLearningObservations(observations:GapFeedbackObservation[]):Promise<DiscoveryLearningPersistenceStatus>{
  if(!enabledByConfig())return disabled('BEVAKLY_DISCOVERY_LEARNING_ENABLED är inte true. Persistent discovery learning är avstängt.',false);
  if(!getDatabase())return disabled('DATABASE_URL saknas.',true);
  if(!observations.length){
    return {configured:true,enabled:true,schemaReady:true,loadedPatterns:0,savedObservations:0,mode:'database',reason:null};
  }
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return disabled('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_discovery_learning limit 1`;
    let saved=0;
    for(const o of observations){
      await sql`
        insert into intelligence_discovery_learning (
          organization_id,pattern_key,gap_id,source_class,host_class,query_pattern,
          runs,attempted,accepted,high_fact,high_score,empty_runs,first_observed_at,last_observed_at
        ) values (
          ${organizationId}::uuid,${o.key},${o.gapId},${o.sourceClass},${o.hostClass},${o.queryPattern},
          1,${o.attempted},${o.accepted},${o.highFact},${o.highScore},${o.emptyRuns},
          ${o.lastObservedAt}::timestamptz,${o.lastObservedAt}::timestamptz
        )
        on conflict (organization_id,pattern_key) do update set
          gap_id=excluded.gap_id,
          source_class=excluded.source_class,
          host_class=excluded.host_class,
          query_pattern=excluded.query_pattern,
          runs=intelligence_discovery_learning.runs+1,
          attempted=intelligence_discovery_learning.attempted+excluded.attempted,
          accepted=intelligence_discovery_learning.accepted+excluded.accepted,
          high_fact=intelligence_discovery_learning.high_fact+excluded.high_fact,
          high_score=intelligence_discovery_learning.high_score+excluded.high_score,
          empty_runs=intelligence_discovery_learning.empty_runs+excluded.empty_runs,
          last_observed_at=greatest(intelligence_discovery_learning.last_observed_at,excluded.last_observed_at)
      `;
      await sql`
        update intelligence_discovery_learning
        set
          runs=ceil(runs * 0.72)::int,
          attempted=ceil(attempted * 0.72)::int,
          accepted=ceil(accepted * 0.72)::int,
          high_fact=ceil(high_fact * 0.72)::int,
          high_score=ceil(high_score * 0.72)::int,
          empty_runs=ceil(empty_runs * 0.72)::int
        where organization_id=${organizationId}::uuid
          and pattern_key=${o.key}
          and runs >= 24
      `;
      saved++;
    }
    return {configured:true,enabled:true,schemaReady:true,loadedPatterns:0,savedObservations:saved,mode:'database',reason:null};
  }catch(error){
    return disabled(databaseErrorMessage(error),true);
  }
}
