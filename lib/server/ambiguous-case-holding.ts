import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { AmbiguousCaseCandidate } from '@/lib/intelligence/ambiguous-case-holding';

import { toPersistentAmbiguousCandidate, type PersistentAmbiguousCandidate } from '@/lib/intelligence/ambiguous-case-persistence';

export type AmbiguousCandidatePersistenceStatus={
  configured:boolean;enabled:boolean;schemaReady:boolean;mode:'disabled'|'database';
  saved:number;loaded:number;reason:string|null;
  guardrail:string;
};

function enabledByConfig(){return process.env.BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED==='true';}
function disabled(reason:string,configured=false):AmbiguousCandidatePersistenceStatus{
  return {configured,enabled:false,schemaReady:false,mode:'disabled',saved:0,loaded:0,reason,guardrail:'Persistent holding är avstängt. Kandidater påverkar aldrig case confidence.'};
}
const clampLimit=(n:number)=>Math.max(1,Math.min(500,Math.floor(n)));

export async function persistAmbiguousCandidates(candidates:AmbiguousCaseCandidate[],observedAt:string):Promise<AmbiguousCandidatePersistenceStatus>{
  if(!enabledByConfig())return disabled('BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED är inte true.',false);
  if(!getDatabase())return disabled('DATABASE_URL saknas.',true);
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return disabled('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_ambiguous_case_candidates limit 1`;
    let saved=0;
    for(const candidate of candidates){
      const row=toPersistentAmbiguousCandidate(candidate,observedAt);
      await sql`
        insert into intelligence_ambiguous_case_candidates (
          organization_id,candidate_key,evidence_ids,evidence,identity_score,reasons,
          first_seen,latest_seen,last_observed_at,status,allow_confidence_impact
        ) values (
          ${organizationId}::uuid,${row.candidateKey},${JSON.stringify(row.evidenceIds)}::jsonb,
          ${JSON.stringify(row.evidence)}::jsonb,${row.identityScore},${JSON.stringify(row.reasons)}::jsonb,
          ${row.firstSeen}::timestamptz,${row.latestSeen}::timestamptz,${row.lastObservedAt}::timestamptz,
          'held',false
        )
        on conflict (organization_id,candidate_key) do update set
          evidence_ids=excluded.evidence_ids,
          evidence=excluded.evidence,
          identity_score=greatest(intelligence_ambiguous_case_candidates.identity_score,excluded.identity_score),
          reasons=excluded.reasons,
          first_seen=least(intelligence_ambiguous_case_candidates.first_seen,excluded.first_seen),
          latest_seen=greatest(intelligence_ambiguous_case_candidates.latest_seen,excluded.latest_seen),
          last_observed_at=excluded.last_observed_at,
          status='held',
          allow_confidence_impact=false
      `;
      saved++;
    }
    return {configured:true,enabled:true,schemaReady:true,mode:'database',saved,loaded:0,reason:null,guardrail:'Persistenta kandidater är endast observationsminne. De får aldrig höja case confidence innan en senare identitetsbedömning uttryckligen tillåter fusion.'};
  }catch(error){return disabled(databaseErrorMessage(error),true);}
}

export async function loadAmbiguousCandidates(days=90,limit=200):Promise<{status:AmbiguousCandidatePersistenceStatus;candidates:PersistentAmbiguousCandidate[]}>{
  if(!enabledByConfig())return {status:disabled('BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED är inte true.',false),candidates:[]};
  if(!getDatabase())return {status:disabled('DATABASE_URL saknas.',true),candidates:[]};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql)return {status:disabled('Databasanslutning saknas.',true),candidates:[]};
    await sql`select 1 from intelligence_ambiguous_case_candidates limit 1`;
    const rows=await sql`
      select candidate_key,evidence_ids,evidence,identity_score,reasons,first_seen,latest_seen,last_observed_at,status,allow_confidence_impact
      from intelligence_ambiguous_case_candidates
      where organization_id=${organizationId}::uuid
        and status='held'
        and last_observed_at >= now() - (${Math.max(1,Math.min(365,Math.floor(days)))}::text || ' days')::interval
      order by identity_score desc,last_observed_at desc
      limit ${clampLimit(limit)}
    `;
    const candidates:PersistentAmbiguousCandidate[]=(rows as any[]).map(row=>({
      candidateKey:String(row.candidate_key),
      evidenceIds:(Array.isArray(row.evidence_ids)?row.evidence_ids.map(String):[]) as [string,string],
      evidence:(Array.isArray(row.evidence)?row.evidence:[]) as [AmbiguousEvidenceSnapshot,AmbiguousEvidenceSnapshot],
      identityScore:Number(row.identity_score??0),reasons:Array.isArray(row.reasons)?row.reasons.map(String):[],
      firstSeen:new Date(row.first_seen).toISOString(),latestSeen:new Date(row.latest_seen).toISOString(),
      lastObservedAt:new Date(row.last_observed_at).toISOString(),status:'held' as const,allowConfidenceImpact:false as const,
    })).filter(x=>x.evidenceIds.length===2&&x.evidence.length===2);
    return {status:{configured:true,enabled:true,schemaReady:true,mode:'database',saved:0,loaded:candidates.length,reason:null,guardrail:'Laddade kandidater är endast observationsminne och påverkar inte confidence.'},candidates};
  }catch(error){return {status:disabled(databaseErrorMessage(error),true),candidates:[]};}
}

export async function applyAmbiguousCandidateResolutions(resolutions:Array<{candidateKey:string;decision:'keep-held'|'promote-probable'|'promote-same-case'|'reject-conflict'|'expire';reason:string}>):Promise<{updated:number;reason:string|null}>{
  if(!enabledByConfig()||!getDatabase()||!resolutions.length)return {updated:0,reason:null};
  try{
    const {sql,organizationId}=await ensureOrganization();if(!sql)return {updated:0,reason:'Databasanslutning saknas.'};
    let updated=0;
    for(const r of resolutions){
      if(r.decision==='keep-held')continue;
      const status=r.decision.startsWith('promote-')?'promoted':r.decision==='expire'?'expired':'rejected';
      await sql`update intelligence_ambiguous_case_candidates set status=${status},resolution_reason=${r.reason},promoted_at=case when ${status}='promoted' then now() else promoted_at end,rejected_at=case when ${status} in ('rejected','expired') then now() else rejected_at end,allow_confidence_impact=false where organization_id=${organizationId}::uuid and candidate_key=${r.candidateKey} and status='held'`;
      updated++;
    }
    return {updated,reason:null};
  }catch(error){return {updated:0,reason:databaseErrorMessage(error)};}
}
