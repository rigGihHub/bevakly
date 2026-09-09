import { assessCaseIdentityConfidence } from './case-identity-confidence';
import type { IdentityInput } from './cross-signal-identity';

export type HoldingInput=IdentityInput&{id:string;publishedAt:string;source?:string;url?:string};
export type AmbiguousEvidenceSnapshot={
  id:string;title:string;text:string;competitors:string[];geographies:string[];publishedAt:string;source?:string;url?:string;
};
export type AmbiguousCaseCandidate={
  id:string;
  evidenceIds:[string,string];
  evidence:[AmbiguousEvidenceSnapshot,AmbiguousEvidenceSnapshot];
  identityScore:number;
  status:'held';
  reasons:string[];
  firstSeen:string;
  latestSeen:string;
  allowConfidenceImpact:false;
  guardrail:string;
};
export type AmbiguousHoldingArea={
  mode:'current-run';
  persistent:false;
  candidates:AmbiguousCaseCandidate[];
  summary:{held:number;discardedConflicts:number;alreadyLinkable:number;tooWeak:number};
  methodology:string;
};

const DAY=86400000;
const hash=(v:string)=>{let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
const ageDays=(a:string,b:string)=>Math.abs(new Date(a).getTime()-new Date(b).getTime())/DAY;
const norm=(s:string)=>s.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').trim();
const sharedCompetitor=(a:HoldingInput,b:HoldingInput)=>a.competitors.map(norm).some(x=>b.competitors.map(norm).includes(x));

export function buildAmbiguousCaseHoldingArea(input:HoldingInput[],maxAgeDays=45,minIdentityScore=14):AmbiguousHoldingArea{
  const valid=input.filter(x=>x.publishedAt&&!Number.isNaN(new Date(x.publishedAt).getTime()));
  const candidates:AmbiguousCaseCandidate[]=[];
  let discardedConflicts=0,alreadyLinkable=0,tooWeak=0;
  for(let i=0;i<valid.length;i++)for(let j=i+1;j<valid.length;j++){
    const a=valid[i],b=valid[j];
    if(ageDays(a.publishedAt,b.publishedAt)>maxAgeDays)continue;
    const relation=assessCaseIdentityConfidence(a,b);
    if(relation.relation==='conflict'){discardedConflicts++;continue;}
    if(relation.allowFusion){alreadyLinkable++;continue;}
    if(relation.relation!=='ambiguous'||relation.score<minIdentityScore||!sharedCompetitor(a,b)){tooWeak++;continue;}
    const dates=[new Date(a.publishedAt).toISOString(),new Date(b.publishedAt).toISOString()].sort();
    const ids=[a.id,b.id].sort() as [string,string];
    candidates.push({
      id:`holding-${hash(ids.join('|'))}`,
      evidenceIds:ids,
      evidence:[a,b].sort((x,y)=>x.id.localeCompare(y.id)).map(x=>({id:x.id,title:x.title,text:x.text,competitors:x.competitors,geographies:x.geographies,publishedAt:new Date(x.publishedAt).toISOString(),source:x.source,url:x.url})) as [AmbiguousEvidenceSnapshot,AmbiguousEvidenceSnapshot],
      identityScore:relation.score,
      status:'held',
      reasons:relation.reasons,
      firstSeen:dates[0],latestSeen:dates[1],
      allowConfidenceImpact:false,
      guardrail:'Kandidaten hålls utanför fusion och får inte höja confidence. Ny evidens måste först ge en tillräckligt stark identitetsrelation vid en senare analys.'
    });
  }
  candidates.sort((a,b)=>b.identityScore-a.identityScore||new Date(b.latestSeen).getTime()-new Date(a.latestSeen).getTime());
  return {mode:'current-run',persistent:false,candidates,summary:{held:candidates.length,discardedConflicts,alreadyLinkable,tooWeak},methodology:'Ambigua par med observerad men otillräcklig identitetslikhet hålls separat från fusion. Explicit konflikt kasseras. Kandidater påverkar aldrig case confidence i denna release.'};
}
