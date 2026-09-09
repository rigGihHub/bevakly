import {buildAmbiguousCaseHoldingArea,type HoldingInput} from '../lib/intelligence/ambiguous-case-holding';
import {toPersistentAmbiguousCandidate} from '../lib/intelligence/ambiguous-case-persistence';
const x=(id:string,title:string,text:string,geo:string[]=[],competitor='PreZero',publishedAt='2026-09-01T08:00:00Z'):HoldingInput=>({id,title,text,competitors:competitor?[competitor]:[],geographies:geo,publishedAt,source:'fixture',url:`https://example.test/${id}`});
const area=buildAmbiguousCaseHoldingArea([
  x('a','Ny terminal','Planerad återvinningsterminal.'),
  x('b','Miljösamråd','Samråd om avfallsanläggning.'),
]);
if(area.candidates.length!==1)throw new Error('Expected held candidate');
const c=area.candidates[0];
if(c.evidence.length!==2||c.evidence[0].id!=='a'||c.evidence[1].id!=='b')throw new Error('Evidence snapshots must be stable and complete');
const row=toPersistentAmbiguousCandidate(c,'2026-09-08T10:00:00Z');
if(row.allowConfidenceImpact!==false||row.status!=='held')throw new Error('Persistent candidate must remain quarantined');
if(row.candidateKey!==c.id||row.evidenceIds.join('|')!=='a|b')throw new Error('Persistent identity must be deterministic');
if(row.evidence.some(e=>!e.title||!e.text||!e.publishedAt))throw new Error('Persistent snapshots need re-evaluation fields');
console.log('PASS stable key; PASS evidence snapshots; PASS quarantine guardrail; PASS persistence serialization');
