import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { CaseSnapshot } from '@/lib/intelligence/case-history';

export type CaseHistoryPersistenceStatus={
  configured:boolean;
  enabled:boolean;
  schemaReady:boolean;
  savedSnapshots:number;
  firstSeenAvailable:boolean;
  mode:'disabled'|'database';
  reason:string|null;
};

function enabledByConfig(){
  return process.env.BEVAKLY_CASE_HISTORY_ENABLED==='true';
}

export async function persistCaseSnapshots(snapshots:CaseSnapshot[]):Promise<CaseHistoryPersistenceStatus>{
  if(!enabledByConfig()){
    return {configured:false,enabled:false,schemaReady:false,savedSnapshots:0,firstSeenAvailable:false,mode:'disabled',reason:'BEVAKLY_CASE_HISTORY_ENABLED är inte true. Case history körs därför inte mot databasen ännu.'};
  }
  if(!getDatabase()){
    return {configured:true,enabled:false,schemaReady:false,savedSnapshots:0,firstSeenAvailable:false,mode:'disabled',reason:'DATABASE_URL saknas.'};
  }
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql) return {configured:true,enabled:false,schemaReady:false,savedSnapshots:0,firstSeenAvailable:false,mode:'disabled',reason:'Databasanslutning saknas.'};

    // Explicit schema probe. Failure disables case persistence without breaking the feed.
    await sql`select 1 from intelligence_cases limit 1`;
    await sql`select 1 from intelligence_case_snapshots limit 1`;

    let savedSnapshots=0;
    for(const s of snapshots){
      await sql`
        insert into intelligence_cases (
          organization_id,case_key,headline,competitors,geographies,first_observed_at,last_observed_at,
          latest_stage,latest_direction,latest_score,latest_fact_count
        ) values (
          ${organizationId}::uuid,${s.caseKey},${s.headline},${JSON.stringify(s.competitors)}::jsonb,
          ${JSON.stringify(s.geographies)}::jsonb,${s.observedAt}::timestamptz,${s.observedAt}::timestamptz,
          ${s.stage},${s.direction},${s.escalationScore},${s.facts}
        )
        on conflict (organization_id,case_key) do update set
          headline=excluded.headline,
          competitors=excluded.competitors,
          geographies=excluded.geographies,
          last_observed_at=excluded.last_observed_at,
          latest_stage=excluded.latest_stage,
          latest_direction=excluded.latest_direction,
          latest_score=excluded.latest_score,
          latest_fact_count=excluded.latest_fact_count
      `;
      const latestRows=await sql`
        select evidence_latest_seen,stage,direction,escalation_score,interpretation_confidence,fact_count,source_classes
        from intelligence_case_snapshots
        where organization_id=${organizationId}::uuid and case_key=${s.caseKey}
        order by observed_at desc
        limit 1
      `;
      const latest=(latestRows as any[])[0];
      const latestClasses=Array.isArray(latest?.source_classes)?[...latest.source_classes].map(String).sort():[];
      const currentClasses=[...s.sourceClasses].map(String).sort();
      const materiallyChanged=!latest
        || new Date(latest.evidence_latest_seen).toISOString()!==new Date(s.evidenceLatestSeen).toISOString()
        || String(latest.stage)!==s.stage
        || String(latest.direction)!==s.direction
        || Number(latest.escalation_score)!==s.escalationScore
        || String(latest.interpretation_confidence)!==s.interpretationConfidence
        || Number(latest.fact_count)!==s.facts
        || JSON.stringify(latestClasses)!==JSON.stringify(currentClasses);

      if(materiallyChanged){
        await sql`
          insert into intelligence_case_snapshots (
            organization_id,case_key,observed_at,timeline_id,evidence_first_seen,evidence_latest_seen,
            stage,direction,escalation_score,interpretation_confidence,fact_count,source_classes
          ) values (
            ${organizationId}::uuid,${s.caseKey},${s.observedAt}::timestamptz,${s.timelineId},
            ${s.evidenceFirstSeen}::timestamptz,${s.evidenceLatestSeen}::timestamptz,
            ${s.stage},${s.direction},${s.escalationScore},${s.interpretationConfidence},${s.facts},
            ${JSON.stringify(s.sourceClasses)}::jsonb
          )
          on conflict (organization_id,case_key,observed_at) do update set
            timeline_id=excluded.timeline_id,
            evidence_first_seen=excluded.evidence_first_seen,
            evidence_latest_seen=excluded.evidence_latest_seen,
            stage=excluded.stage,
            direction=excluded.direction,
            escalation_score=excluded.escalation_score,
            interpretation_confidence=excluded.interpretation_confidence,
            fact_count=excluded.fact_count,
            source_classes=excluded.source_classes
        `;
        savedSnapshots++;
      }
    }
    return {configured:true,enabled:true,schemaReady:true,savedSnapshots,firstSeenAvailable:true,mode:'database',reason:null};
  }catch(error){
    return {configured:true,enabled:false,schemaReady:false,savedSnapshots:0,firstSeenAvailable:false,mode:'disabled',reason:databaseErrorMessage(error)};
  }
}


export async function loadCaseSnapshots(caseKeys:string[],days=180):Promise<{enabled:boolean;snapshots:CaseSnapshot[];reason:string|null}>{
  if(!enabledByConfig())return {enabled:false,snapshots:[],reason:'Case history är inte aktiverad.'};
  if(!getDatabase())return {enabled:false,snapshots:[],reason:'DATABASE_URL saknas.'};
  const keys=[...new Set(caseKeys.filter(Boolean))].slice(0,20);
  if(!keys.length)return {enabled:true,snapshots:[],reason:null};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return {enabled:false,snapshots:[],reason:'Databasanslutning saknas.'};
    const snapshots:CaseSnapshot[]=[];
    for(const caseKey of keys){
      const rows=await sql`
        select s.case_key,s.observed_at,s.timeline_id,s.evidence_first_seen,s.evidence_latest_seen,
               s.stage,s.direction,s.escalation_score,s.interpretation_confidence,s.fact_count,s.source_classes,
               c.headline,c.competitors,c.geographies
        from intelligence_case_snapshots s
        join intelligence_cases c
          on c.organization_id=s.organization_id and c.case_key=s.case_key
        where s.organization_id=${organizationId}::uuid
          and s.case_key=${caseKey}
          and s.observed_at >= now() - (${Math.max(1,Math.min(365,days))}::text || ' days')::interval
        order by s.observed_at asc
        limit 100
      `;
      for(const row of rows as any[]){
        snapshots.push({
          caseKey:String(row.case_key),
          timelineId:String(row.timeline_id),
          headline:String(row.headline??''),
          competitors:Array.isArray(row.competitors)?row.competitors:[],
          geographies:Array.isArray(row.geographies)?row.geographies:[],
          observedAt:new Date(row.observed_at).toISOString(),
          evidenceFirstSeen:new Date(row.evidence_first_seen).toISOString(),
          evidenceLatestSeen:new Date(row.evidence_latest_seen).toISOString(),
          stage:String(row.stage),
          direction:String(row.direction),
          escalationScore:Number(row.escalation_score??0),
          interpretationConfidence:String(row.interpretation_confidence??'Låg'),
          facts:Number(row.fact_count??0),
          sourceClasses:Array.isArray(row.source_classes)?row.source_classes:[],
        });
      }
    }
    return {enabled:true,snapshots,reason:null};
  }catch(error){
    return {enabled:false,snapshots:[],reason:databaseErrorMessage(error)};
  }
}
