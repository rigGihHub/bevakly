import type { DiscoveryOrchestratorRun } from './discovery-orchestrator';
import type { DiscoveryProviderQuery } from './discovery-provider';

export type GapFeedbackObservation={
  key:string;
  gapId:string;
  sourceClass:string;
  hostClass:string;
  queryPattern:string;
  attempted:number;
  accepted:number;
  highFact:number;
  highScore:number;
  emptyRuns:number;
  lastObservedAt:string;
};

export type GapFeedbackScore={
  key:string;
  gapId:string;
  sourceClass:string;
  hostClass:string;
  runs:number;
  yieldRate:number;
  highFactRate:number;
  highScoreRate:number;
  score:number;
  lane:'preferred'|'standard'|'explore';
  reasons:string[];
};

export type GapFeedbackPersistentState={
  key:string;
  runs:number;
  attempted:number;
  accepted:number;
  highFact:number;
  highScore:number;
  emptyRuns:number;
  lastObservedAt:string;
};

type Runtime={
  runs:number;
  attempted:number;
  accepted:number;
  highFact:number;
  highScore:number;
  emptyRuns:number;
  lastObservedAt:number;
};

const state=new Map<string,Runtime>();
const MAX_WEIGHT=24;

function norm(v:string){return v.toLocaleLowerCase('sv-SE').replace(/\s+/g,' ').trim();}
function queryPattern(q:DiscoveryProviderQuery){
  const hosts=(q.allowedHosts??[]).map(norm).sort();
  const gapId=q.targetId.split(':')[1]??'unknown';
  return {
    gapId,
    sourceClass:q.sourceClass??'unknown',
    hostClass:hosts.length?hosts.join('|'):'open-web',
    queryPattern:norm(q.query).replace(/"[^"]+"/g,'"entity"'),
  };
}
function keyOf(q:DiscoveryProviderQuery){
  const p=queryPattern(q);
  return `${p.gapId}|${p.sourceClass}|${p.hostClass}|${p.queryPattern}`;
}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

export function hydrateGapDiscoveryFeedback(rows:GapFeedbackPersistentState[]){
  let hydrated=0;
  for(const row of rows){
    if(!row?.key)continue;
    const incoming:Runtime={
      runs:Math.max(0,Math.min(MAX_WEIGHT,Math.floor(row.runs||0))),
      attempted:Math.max(0,Math.floor(row.attempted||0)),
      accepted:Math.max(0,Math.floor(row.accepted||0)),
      highFact:Math.max(0,Math.floor(row.highFact||0)),
      highScore:Math.max(0,Math.floor(row.highScore||0)),
      emptyRuns:Math.max(0,Math.min(MAX_WEIGHT,Math.floor(row.emptyRuns||0))),
      lastObservedAt:Number.isNaN(new Date(row.lastObservedAt).getTime())?0:new Date(row.lastObservedAt).getTime(),
    };
    const current=state.get(row.key);
    // Hydration may happen repeatedly in a warm process. Only replace when the database
    // clearly contains at least as much history, preventing duplicate accumulation.
    if(!current||incoming.attempted>current.attempted||(incoming.attempted===current.attempted&&incoming.lastObservedAt>current.lastObservedAt)){
      state.set(row.key,incoming);
      hydrated++;
    }
  }
  return hydrated;
}

export function recordGapDiscoveryFeedback(
  queue:DiscoveryProviderQuery[],
  run:DiscoveryOrchestratorRun,
  now=new Date(),
):GapFeedbackObservation[]{
  const acceptedByJob=new Map<string,typeof run.results>();
  for(const result of run.results){
    const list=acceptedByJob.get(result.jobId)??[];
    list.push(result);
    acceptedByJob.set(result.jobId,list);
  }

  const observed:GapFeedbackObservation[]=[];
  for(const q of queue){
    const attempts=run.attempts.filter(x=>x.jobId===q.jobId);
    const freshAttempts=attempts.filter(x=>!x.fromCache);
    const executed=freshAttempts.length>0?1:0;
    // A cache replay can serve useful results to the user, but it is not a new
    // experiment and must not reinforce the learning model again.
    if(!executed)continue;
    const accepted=acceptedByJob.get(q.jobId)??[];
    const p=queryPattern(q);
    const key=keyOf(q);
    const prev=state.get(key)??{runs:0,attempted:0,accepted:0,highFact:0,highScore:0,emptyRuns:0,lastObservedAt:0};
    const next:Runtime={
      runs:Math.min(MAX_WEIGHT,prev.runs+1),
      attempted:prev.attempted+1,
      accepted:prev.accepted+accepted.length,
      highFact:prev.highFact+accepted.filter(x=>x.factConfidence==='Hög').length,
      highScore:prev.highScore+accepted.filter(x=>x.score>=75).length,
      emptyRuns:Math.min(MAX_WEIGHT,prev.emptyRuns+(accepted.length===0?1:0)),
      lastObservedAt:now.getTime(),
    };
    if(next.runs>=MAX_WEIGHT){
      next.runs=Math.ceil(next.runs*.72);
      next.attempted=Math.ceil(next.attempted*.72);
      next.accepted=Math.ceil(next.accepted*.72);
      next.highFact=Math.ceil(next.highFact*.72);
      next.highScore=Math.ceil(next.highScore*.72);
      next.emptyRuns=Math.ceil(next.emptyRuns*.72);
    }
    state.set(key,next);
    observed.push({
      key,gapId:p.gapId,sourceClass:p.sourceClass,hostClass:p.hostClass,queryPattern:p.queryPattern,
      attempted:1,accepted:accepted.length,
      highFact:accepted.filter(x=>x.factConfidence==='Hög').length,
      highScore:accepted.filter(x=>x.score>=75).length,
      emptyRuns:accepted.length===0?1:0,
      lastObservedAt:now.toISOString(),
    });
  }
  return observed;
}

function scoreRuntime(key:string,r:Runtime):GapFeedbackScore{
  const [gapId,sourceClass,hostClass]=key.split('|');
  const runs=Math.max(1,r.runs);
  const yieldRate=r.accepted/Math.max(1,r.attempted);
  const highFactRate=r.accepted?r.highFact/r.accepted:0;
  const highScoreRate=r.accepted?r.highScore/r.accepted:0;
  const emptyRate=r.emptyRuns/runs;
  const confidence=Math.min(1,r.runs/6);
  const learned=(Math.min(1,yieldRate/2)*38 + highFactRate*25 + highScoreRate*22 - emptyRate*18)*confidence;
  const explorationBonus=r.runs<3?12:0;
  const score=clamp(Math.round(35+learned+explorationBonus),0,100);
  const lane:GapFeedbackScore['lane']=r.runs<3?'explore':score>=68?'preferred':score<40?'explore':'standard';
  const reasons:string[]=[];
  if(yieldRate>=1)reasons.push('hög accepterad träffgrad');
  if(highFactRate>=.5&&r.accepted>=2)reasons.push('stor andel träffar med hög faktasäkerhet');
  if(highScoreRate>=.5&&r.accepted>=2)reasons.push('många starka discovery-träffar');
  if(emptyRate>=.6&&r.runs>=4)reasons.push('många tomma körningar – nedprioriteras försiktigt');
  if(r.runs<3)reasons.push('obeprövat mönster – behåller explorationsutrymme');
  if(!reasons.length)reasons.push('normal prioritet utifrån observerad gap-yield');
  return {key,gapId,sourceClass,hostClass,runs:r.runs,yieldRate:Number(yieldRate.toFixed(2)),highFactRate:Number(highFactRate.toFixed(2)),highScoreRate:Number(highScoreRate.toFixed(2)),score,lane,reasons};
}

export function gapDiscoveryFeedbackScores(){
  return [...state.entries()].map(([key,r])=>scoreRuntime(key,r)).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
}

export function rankGapDiscoveryQueue(queue:DiscoveryProviderQuery[]){
  const scores=new Map(gapDiscoveryFeedbackScores().map(x=>[x.key,x] as const));
  const enriched=queue.map((q,index)=>{
    const key=keyOf(q);
    const learned=scores.get(key);
    return {q,index,score:learned?.score??47,lane:learned?.lane??'explore'};
  });
  // Never remove a query. Learning can only reorder within the existing hard budget.
  // Keep at least one explore item near the front when available.
  const preferred=enriched.filter(x=>x.lane==='preferred').sort((a,b)=>b.score-a.score||a.index-b.index);
  const standard=enriched.filter(x=>x.lane==='standard').sort((a,b)=>b.score-a.score||a.index-b.index);
  const explore=enriched.filter(x=>x.lane==='explore').sort((a,b)=>a.index-b.index);
  const out:typeof enriched=[];
  let p=0,s=0,e=0;
  while(p<preferred.length||s<standard.length||e<explore.length){
    for(let i=0;i<2&&p<preferred.length;i++)out.push(preferred[p++]);
    if(e<explore.length)out.push(explore[e++]);
    if(s<standard.length)out.push(standard[s++]);
  }
  return out.map(x=>x.q);
}

export function gapDiscoveryFeedbackSummary(){
  const scores=gapDiscoveryFeedbackScores();
  return {
    mode:'memory' as const,
    persistent:false,
    trackedPatterns:scores.length,
    preferred:scores.filter(x=>x.lane==='preferred').length,
    standard:scores.filter(x=>x.lane==='standard').length,
    explore:scores.filter(x=>x.lane==='explore').length,
    automaticDisable:false,
    principle:'Lär av faktisk yield men stäng aldrig automatiskt av ett sökmönster; behåll exploration och låt gammal framgång decay.',
    topPatterns:scores.slice(0,6),
  };
}
