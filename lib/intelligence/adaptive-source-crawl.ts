import type { WatchSource } from './sources';
import { assessSourceDiversity, diversityExplorationBonus } from './source-diversity';

export type AdaptiveSourceLane='priority'|'standard'|'explore';
export type AdaptiveSourcePlanItem={
  source:WatchSource;
  lane:AdaptiveSourceLane;
  priorityScore:number;
  candidateLimit:number;
  reasons:string[];
};
export type AdaptiveSourceOutcome={
  sourceId:string;
  ok:boolean;
  candidates:number;
  unseen:number;
  acceptedPrimary:number;
  confirmations:number;
  tierA:number;
  tierB:number;
};
type SourceRuntime={
  runs:number; okRuns:number; totalCandidates:number; totalUnseen:number;
  totalPrimary:number; totalConfirmations:number; totalTierA:number; totalTierB:number; emptyRuns:number; lastRunAt:number;
};
const state=new Map<string,SourceRuntime>();
const MAX_RUNS_WEIGHT=20;

function runtime(sourceId:string):SourceRuntime{
  return state.get(sourceId)??{runs:0,okRuns:0,totalCandidates:0,totalUnseen:0,totalPrimary:0,totalConfirmations:0,totalTierA:0,totalTierB:0,emptyRuns:0,lastRunAt:0};
}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}
function scoreSource(source:WatchSource, r:SourceRuntime){
  const staticBase=(4-source.tier)*12 + clamp(source.trustScore??50,0,100)*0.22;
  if(r.runs===0)return {score:staticBase+10,reasons:['ny/obeprövad källa – får utforskningsutrymme']};
  const reliability=r.okRuns/r.runs;
  const noveltyRate=r.totalCandidates?r.totalUnseen/r.totalCandidates:0;
  const productiveRate=(r.totalPrimary+r.totalConfirmations)/Math.max(1,r.runs);
  const highValueRate=(r.totalTierA+r.totalTierB*.55)/Math.max(1,r.runs);
  const emptyRate=r.emptyRuns/r.runs;
  const confidence=Math.min(1,r.runs/8);
  const learned=(reliability*15 + Math.min(1,noveltyRate*1.8)*14 + Math.min(1,productiveRate/2)*18 + Math.min(1,highValueRate/1.5)*28 - emptyRate*10)*confidence;
  const score=staticBase+learned;
  const reasons:string[]=[];
  if(reliability>=.85&&r.runs>=3)reasons.push('stabil hämtning');
  if(noveltyRate>=.35&&r.runs>=2)reasons.push('hög andel nya kandidater');
  if(productiveRate>=1&&r.runs>=2)reasons.push('levererar primära fynd/bekräftelser');
  if(highValueRate>=.7&&r.runs>=3)reasons.push('hög andel A/B-nyheter för marknads-/anbudsarbete');
  if(r.totalTierA>=2&&r.runs>=3)reasons.push('återkommande direkt affärskritiska nyheter');
  if(emptyRate>=.6&&r.runs>=4)reasons.push('många tomma körningar – nedprioriteras försiktigt');
  if(!reasons.length)reasons.push('normal prioritet utifrån källa och observerad historik');
  return {score,reasons};
}

export function buildAdaptiveSourcePlan(sources:WatchSource[], now=new Date()):AdaptiveSourcePlanItem[]{
  const diversity=assessSourceDiversity(sources);
  const scored=sources.map(source=>{
    const r=runtime(source.id); const x=scoreSource(source,r); const d=diversityExplorationBonus(source,diversity);
    return {source,score:x.score+d.bonus,reasons:[...x.reasons,...d.reasons.map(reason=>`diversity exploration: ${reason}`)],r,diversityBonus:d.bonus};
  }).sort((a,b)=>b.score-a.score||a.source.tier-b.source.tier||b.source.trustScore-a.source.trustScore);

  const explore=scored.filter(x=>x.r.runs<3 || x.diversityBonus>0 || (x.r.lastRunAt>0 && now.getTime()-x.r.lastRunAt>3*24*60*60*1000));
  const exploreIds=new Set(explore.slice(0,Math.max(2,Math.ceil(sources.length*.12))).map(x=>x.source.id));
  const topCut=Math.max(6,Math.ceil(sources.length*.3));
  const priorityIds=new Set(scored.slice(0,topCut).map(x=>x.source.id));
  const planned=scored.map(x=>{
    const lane:AdaptiveSourceLane=exploreIds.has(x.source.id)?'explore':priorityIds.has(x.source.id)?'priority':'standard';
    const r=runtime(x.source.id);
    const highValueRate=(r.totalTierA+r.totalTierB*.55)/Math.max(1,r.runs);
    const provenHighValue=r.runs>=3&&highValueRate>=.7;
    const candidateLimit=lane==='priority'?(provenHighValue?46:40):lane==='explore'?34:24;
    return {source:x.source,lane,priorityScore:Math.round(x.score),candidateLimit,reasons:x.reasons};
  });
  // Keep exploration visible early enough to survive downstream candidate caps.
  const priority=planned.filter(x=>x.lane==='priority');
  const standard=planned.filter(x=>x.lane==='standard');
  const exploration=planned.filter(x=>x.lane==='explore');
  const ordered:AdaptiveSourcePlanItem[]=[];
  let p=0,s=0,e=0;
  while(p<priority.length||s<standard.length||e<exploration.length){
    for(let i=0;i<4&&p<priority.length;i++)ordered.push(priority[p++]);
    if(e<exploration.length)ordered.push(exploration[e++]);
    for(let i=0;i<3&&s<standard.length;i++)ordered.push(standard[s++]);
  }
  return ordered;
}

export function recordAdaptiveSourceOutcomes(outcomes:AdaptiveSourceOutcome[], now=new Date()){
  for(const o of outcomes){
    const prev=runtime(o.sourceId);
    const next:SourceRuntime={
      runs:Math.min(MAX_RUNS_WEIGHT,prev.runs+1),
      okRuns:Math.min(MAX_RUNS_WEIGHT,prev.okRuns+(o.ok?1:0)),
      totalCandidates:prev.totalCandidates+o.candidates,
      totalUnseen:prev.totalUnseen+o.unseen,
      totalPrimary:prev.totalPrimary+o.acceptedPrimary,
      totalConfirmations:prev.totalConfirmations+o.confirmations,
      totalTierA:prev.totalTierA+o.tierA,
      totalTierB:prev.totalTierB+o.tierB,
      emptyRuns:Math.min(MAX_RUNS_WEIGHT,prev.emptyRuns+(o.ok&&o.candidates===0?1:0)),
      lastRunAt:now.getTime(),
    };
    // Periodically decay accumulated volumes so old success cannot dominate forever.
    if(next.runs>=MAX_RUNS_WEIGHT){
      next.runs=Math.ceil(next.runs*.7); next.okRuns=Math.ceil(next.okRuns*.7);
      next.totalCandidates=Math.ceil(next.totalCandidates*.7); next.totalUnseen=Math.ceil(next.totalUnseen*.7);
      next.totalPrimary=Math.ceil(next.totalPrimary*.7); next.totalConfirmations=Math.ceil(next.totalConfirmations*.7);
      next.totalTierA=Math.ceil(next.totalTierA*.7); next.totalTierB=Math.ceil(next.totalTierB*.7);
      next.emptyRuns=Math.ceil(next.emptyRuns*.7);
    }
    state.set(o.sourceId,next);
  }
}

export function adaptiveSourceStateSummary(){
  return {mode:'memory' as const,persistent:false,trackedSources:state.size,automaticDisable:false,highValueLearning:true,diversityProtection:true,trustSeparatedFromExploration:true,principle:'prioritera källor som faktiskt levererar A/B-nyheter, men reservera utforskning för blind spots och stäng aldrig av en källa automatiskt'};
}
