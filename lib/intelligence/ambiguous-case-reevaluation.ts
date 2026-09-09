import { assessCaseIdentityConfidence, type CaseIdentityRelation } from './case-identity-confidence';
import type { HoldingInput } from './ambiguous-case-holding';
import type { PersistentAmbiguousCandidate } from './ambiguous-case-persistence';

export type CandidateReevaluationDecision='keep-held'|'promote-probable'|'promote-same-case'|'reject-conflict'|'expire';
export type CandidateReevaluation={
  candidateKey:string;decision:CandidateReevaluationDecision;bestRelation:CaseIdentityRelation;bestIdentityScore:number;
  matchedNewEvidenceId:string|null;reasons:string[];allowConfidenceImpact:false;
  guardrail:string;
};
const DAY=86400000;
const toInput=(e:PersistentAmbiguousCandidate['evidence'][number]):HoldingInput=>({id:e.id,title:e.title,text:e.text,competitors:e.competitors,geographies:e.geographies,publishedAt:e.publishedAt,source:e.source,url:e.url});
const ageDays=(a:string,b:string)=>Math.max(0,(new Date(b).getTime()-new Date(a).getTime())/DAY);
const rank:Record<CaseIdentityRelation,number>={'conflict':0,'ambiguous':1,'probable-related':2,'same-case':3};

export function reevaluatePersistentCandidate(candidate:PersistentAmbiguousCandidate,newEvidence:HoldingInput[],observedAt:string,maxHoldDays=90):CandidateReevaluation{
  const base={candidateKey:candidate.candidateKey,allowConfidenceImpact:false as const};
  if(ageDays(candidate.lastObservedAt,observedAt)>maxHoldDays)return {...base,decision:'expire',bestRelation:'ambiguous',bestIdentityScore:candidate.identityScore,matchedNewEvidenceId:null,reasons:['Ingen ny identitetsstärkande evidens inom holdingfönstret.'],guardrail:'Utgången kandidat påverkar aldrig confidence.'};
  let best:{relation:CaseIdentityRelation;score:number;id:string;reasons:string[]}|null=null;
  let explicitConflict=false;
  for(const fresh of newEvidence){
    if(candidate.evidenceIds.includes(fresh.id))continue;
    const oldCompetitors=new Set(candidate.evidence.flatMap(e=>e.competitors.map(x=>x.toLocaleLowerCase('sv-SE'))));
    const freshCompetitors=fresh.competitors.map(x=>x.toLocaleLowerCase('sv-SE'));
    if(oldCompetitors.size&&(!freshCompetitors.length||!freshCompetitors.some(x=>oldCompetitors.has(x))))continue;
    const relations=candidate.evidence.map(old=>assessCaseIdentityConfidence(toInput(old),fresh));
    const nonConflict=relations.filter(r=>r.relation!=='conflict');
    if(relations.some(r=>r.relation==='conflict')&&nonConflict.length===0)explicitConflict=true;
    for(const r of nonConflict){
      if(r.relation==='conflict')continue;
      if(!best||rank[r.relation]>rank[best.relation]||(rank[r.relation]===rank[best.relation]&&r.score>best.score))best={relation:r.relation,score:r.score,id:fresh.id,reasons:r.reasons};
    }
  }
  if(explicitConflict&&!best)return {...base,decision:'reject-conflict',bestRelation:'conflict',bestIdentityScore:0,matchedNewEvidenceId:null,reasons:['Ny evidens skapar explicit identitetskonflikt.'],guardrail:'Konflikt kan aldrig användas för eskalering.'};
  if(best?.relation==='same-case')return {...base,decision:'promote-same-case',bestRelation:best.relation,bestIdentityScore:best.score,matchedNewEvidenceId:best.id,reasons:best.reasons,guardrail:'Promotion betyder att identiteten nu har starkt stöd. Själva kandidatminnet ger fortfarande 0 confidence; endast den verifierade evidensen får användas i senare fusion.'};
  if(best?.relation==='probable-related')return {...base,decision:'promote-probable',bestRelation:best.relation,bestIdentityScore:best.score,matchedNewEvidenceId:best.id,reasons:best.reasons,guardrail:'Probable-related är en kandidatpromotion, inte bevis för samma verkliga case. Den får inte retroaktivt höja confidence utan vanlig fusion/evidensregler.'};
  if(explicitConflict)return {...base,decision:'reject-conflict',bestRelation:'conflict',bestIdentityScore:0,matchedNewEvidenceId:null,reasons:['Ny evidens innehåller explicit konflikt mot den sparade kandidatens identitet.'],guardrail:'Konflikt stoppar promotion.'};
  return {...base,decision:'keep-held',bestRelation:best?.relation??'ambiguous',bestIdentityScore:Math.max(candidate.identityScore,best?.score??0),matchedNewEvidenceId:best?.id??null,reasons:best?.reasons??candidate.reasons,guardrail:'Otillräckligt identitetsstöd: kandidaten ligger kvar i karantän och påverkar inte confidence.'};
}

export function reevaluatePersistentCandidates(candidates:PersistentAmbiguousCandidate[],newEvidence:HoldingInput[],observedAt:string){
  const decisions=candidates.map(c=>reevaluatePersistentCandidate(c,newEvidence,observedAt));
  return {decisions,summary:{held:decisions.filter(x=>x.decision==='keep-held').length,promotedProbable:decisions.filter(x=>x.decision==='promote-probable').length,promotedSameCase:decisions.filter(x=>x.decision==='promote-same-case').length,rejected:decisions.filter(x=>x.decision==='reject-conflict').length,expired:decisions.filter(x=>x.decision==='expire').length},guardrail:'Re-evaluation ändrar endast kandidatstatus. Persistens i sig är aldrig evidens och ger aldrig confidence.'};
}
