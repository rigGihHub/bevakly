import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { DiscoveryProcessedResult } from '@/lib/intelligence/discovery-result-pipeline';
import type { DiscoveryProviderQuery } from '@/lib/intelligence/discovery-provider';
import type { PendingEvidence, EvidencePromotionDecision } from '@/lib/intelligence/evidence-promotion';
import type { FusionSourceClass } from '@/lib/intelligence/signal-fusion';

export type EvidencePromotionPersistenceStatus={
  configured:boolean;
  enabled:boolean;
  schemaReady:boolean;
  savedPending:number;
  loadedPending:number;
  promotedMarked:number;
  rejectedMarked:number;
  mode:'disabled'|'database';
  reason:string|null;
};

function enabledByConfig(){return process.env.BEVAKLY_EVIDENCE_PROMOTION_ENABLED==='true';}
function disabled(reason:string,configured=false):EvidencePromotionPersistenceStatus{
  return {configured,enabled:false,schemaReady:false,savedPending:0,loadedPending:0,promotedMarked:0,rejectedMarked:0,mode:'disabled',reason};
}
function evidenceKey(canonicalUrl:string,gapId:string){
  let h=2166136261;const value=`${gapId}|${canonicalUrl}`;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16);
}
function sourceClassForQuery(q:DiscoveryProviderQuery):FusionSourceClass{
  const c=q.sourceClass;
  if(c==='municipal-protocol')return 'municipal';
  if(c==='competitor-jobs')return 'jobs';
  if(c==='environmental-record')return 'environmental';
  if(c==='competition-record')return 'competition';
  if(c==='planning-record')return 'planning';
  if(c==='legal-record')return 'legal';
  if(c==='news')return 'news';
  if(c==='authority')return 'authority';
  return 'other';
}

export async function savePendingGapEvidence(
  results:DiscoveryProcessedResult[],
  queue:DiscoveryProviderQuery[],
  discoveredAt:string,
):Promise<EvidencePromotionPersistenceStatus>{
  if(!enabledByConfig())return disabled('BEVAKLY_EVIDENCE_PROMOTION_ENABLED är inte true.',false);
  if(!getDatabase())return disabled('DATABASE_URL saknas.',true);
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return disabled('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_pending_evidence limit 1`;
    const queryByJob=new Map(queue.map(q=>[q.jobId,q] as const));
    let saved=0;
    for(const r of results.filter(x=>x.status==='accepted')){
      const q=queryByJob.get(r.jobId);
      if(!q||!q.targetId.startsWith('gap:'))continue;
      const parts=q.targetId.split(':');
      const gapId=parts[1]??'unknown';
      const timelineId=parts.slice(2).join(':');
      const key=evidenceKey(r.canonicalUrl,gapId);
      await sql`
        insert into intelligence_pending_evidence (
          organization_id,evidence_key,originating_timeline_id,gap_id,source_class,title,url,canonical_url,
          source,published_at,snippet,competitors,geographies,fact_confidence,interpretation_confidence,
          discovery_score,discovered_at,status
        ) values (
          ${organizationId}::uuid,${key},${timelineId},${gapId},${sourceClassForQuery(q)},${r.title},${r.url},${r.canonicalUrl},
          ${r.source},${r.publishedAt}::timestamptz,${r.snippet},${JSON.stringify(r.competitors)}::jsonb,
          ${JSON.stringify(r.geographies)}::jsonb,${r.factConfidence},${r.interpretationConfidence},
          ${r.score},${discoveredAt}::timestamptz,'pending'
        )
        on conflict (organization_id,evidence_key) do update set
          title=excluded.title,
          url=excluded.url,
          canonical_url=excluded.canonical_url,
          source=excluded.source,
          published_at=excluded.published_at,
          snippet=excluded.snippet,
          competitors=excluded.competitors,
          geographies=excluded.geographies,
          fact_confidence=excluded.fact_confidence,
          interpretation_confidence=excluded.interpretation_confidence,
          discovery_score=excluded.discovery_score,
          last_seen_at=excluded.discovered_at
      `;
      saved++;
    }
    return {configured:true,enabled:true,schemaReady:true,savedPending:saved,loadedPending:0,promotedMarked:0,rejectedMarked:0,mode:'database',reason:null};
  }catch(error){return disabled(databaseErrorMessage(error),true);}
}

export async function loadPendingEvidenceBefore(cutoffIso:string,limit=100):Promise<{status:EvidencePromotionPersistenceStatus;items:PendingEvidence[]}>{
  if(!enabledByConfig())return {status:disabled('BEVAKLY_EVIDENCE_PROMOTION_ENABLED är inte true.',false),items:[]};
  if(!getDatabase())return {status:disabled('DATABASE_URL saknas.',true),items:[]};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return {status:disabled('Databasanslutning saknas.',true),items:[]};
    await sql`select 1 from intelligence_pending_evidence limit 1`;
    const rows=await sql`
      select evidence_key,originating_timeline_id,gap_id,source_class,title,url,canonical_url,source,
             published_at,snippet,competitors,geographies,fact_confidence,interpretation_confidence,
             discovery_score,discovered_at
      from intelligence_pending_evidence
      where organization_id=${organizationId}::uuid
        and status='pending'
        and discovered_at < ${cutoffIso}::timestamptz
      order by discovered_at asc
      limit ${Math.max(1,Math.min(500,Math.floor(limit)))}
    `;
    const items:PendingEvidence[]=(rows as any[]).map(row=>({
      evidenceKey:String(row.evidence_key),
      originatingTimelineId:String(row.originating_timeline_id??''),
      gapId:String(row.gap_id),
      sourceClass:String(row.source_class) as FusionSourceClass,
      title:String(row.title),
      url:String(row.url),
      canonicalUrl:String(row.canonical_url),
      source:String(row.source),
      publishedAt:new Date(row.published_at).toISOString(),
      snippet:String(row.snippet??''),
      competitors:Array.isArray(row.competitors)?row.competitors:[],
      geographies:Array.isArray(row.geographies)?row.geographies:[],
      factConfidence:String(row.fact_confidence) as PendingEvidence['factConfidence'],
      interpretationConfidence:String(row.interpretation_confidence) as PendingEvidence['interpretationConfidence'],
      score:Number(row.discovery_score??0),
      discoveredAt:new Date(row.discovered_at).toISOString(),
    }));
    return {status:{configured:true,enabled:true,schemaReady:true,savedPending:0,loadedPending:items.length,promotedMarked:0,rejectedMarked:0,mode:'database',reason:null},items};
  }catch(error){return {status:disabled(databaseErrorMessage(error),true),items:[]};}
}

export async function markEvidencePromotionDecisions(decisions:EvidencePromotionDecision[]):Promise<EvidencePromotionPersistenceStatus>{
  if(!enabledByConfig())return disabled('BEVAKLY_EVIDENCE_PROMOTION_ENABLED är inte true.',false);
  if(!getDatabase())return disabled('DATABASE_URL saknas.',true);
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return disabled('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_pending_evidence limit 1`;
    let promoted=0,rejected=0;
    for(const d of decisions){
      if(d.decision==='hold')continue;
      const status=d.decision==='promote'?'promoted':'rejected';
      await sql`
        update intelligence_pending_evidence
        set status=${status},promotion_reason=${d.reason},
            promoted_at=case when ${status}='promoted' then now() else promoted_at end,
            rejected_at=case when ${status}='rejected' then now() else rejected_at end
        where organization_id=${organizationId}::uuid and evidence_key=${d.evidenceKey} and status='pending'
      `;
      if(status==='promoted')promoted++; else rejected++;
    }
    return {configured:true,enabled:true,schemaReady:true,savedPending:0,loadedPending:0,promotedMarked:promoted,rejectedMarked:rejected,mode:'database',reason:null};
  }catch(error){return disabled(databaseErrorMessage(error),true);}
}
