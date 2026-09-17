import type { AdaptiveSourcePlanItem } from './adaptive-source-crawl';

export type RefreshDeadlines={sources:number;articles:number;discovery:number;total:number};

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rotated<T extends {source:{id:string}}>(items:T[],key:string){return [...items].sort((a,b)=>hash(`${key}|${a.source.id}`)-hash(`${key}|${b.source.id}`));}
function ranked(items:AdaptiveSourcePlanItem[],key:string){
  return [...items].sort((a,b)=>b.priorityScore-a.priorityScore||hash(`${key}|${a.source.id}`)-hash(`${key}|${b.source.id}`));
}

export function buildRefreshDeadlines(startedAt=Date.now(),totalMs=45_000):RefreshDeadlines{
  const total=Math.max(20_000,totalMs);
  return {
    sources:startedAt+Math.round(total*.30),
    articles:startedAt+Math.round(total*.62),
    discovery:startedAt+Math.round(total*.86),
    total:startedAt+total,
  };
}

/**
 * Selects a bounded crawl slice. Learned source yield controls most of the budget while a protected
 * exploration slice prevents the system from becoming blind to new or temporarily quiet sources.
 */
export function buildRefreshSourceBudget(plan:AdaptiveSourcePlanItem[],now=new Date(),maxSources=36){
  const cap=Math.max(8,Math.min(plan.length,maxSources));
  const rotationKey=now.toISOString().slice(0,13);
  const selected:AdaptiveSourcePlanItem[]=[];const ids=new Set<string>();
  const add=(items:AdaptiveSourcePlanItem[],limit:number)=>{
    for(const item of items){if(selected.length>=cap||limit<=0)break;if(ids.has(item.source.id))continue;selected.push(item);ids.add(item.source.id);limit--;}
  };
  add(ranked(plan.filter(x=>x.source.type==='competitor'),rotationKey),cap);
  const priorityTarget=Math.max(0,Math.min(cap-selected.length,Math.ceil(cap*.5)));
  add(ranked(plan.filter(x=>x.lane==='priority'),rotationKey),priorityTarget);
  const explorationTarget=Math.max(2,Math.ceil(cap*.12));
  add(rotated(plan.filter(x=>x.lane==='explore'),rotationKey),explorationTarget);
  const standardTarget=Math.max(2,Math.ceil(cap*.22));
  add(ranked(plan.filter(x=>x.lane==='standard'),rotationKey),standardTarget);
  add(ranked(plan,rotationKey),cap-selected.length);
  const omitted=plan.filter(x=>!ids.has(x.source.id));
  const count=(items:AdaptiveSourcePlanItem[],lane:AdaptiveSourcePlanItem['lane'])=>items.filter(x=>x.lane===lane).length;
  const selectedScores=selected.map(x=>x.priorityScore);
  const omittedScores=omitted.map(x=>x.priorityScore);
  return {
    selected,
    diagnostics:{
      configured:plan.length,selected:selected.length,omitted:omitted.length,rotation:'yield-ranked + hourly exploration',maxSources:cap,
      selectedByLane:{priority:count(selected,'priority'),standard:count(selected,'standard'),explore:count(selected,'explore')},
      omittedByLane:{priority:count(omitted,'priority'),standard:count(omitted,'standard'),explore:count(omitted,'explore')},
      protectedCompetitors:selected.filter(x=>x.source.type==='competitor').length,
      selectedPriorityScore:{min:selectedScores.length?Math.min(...selectedScores):null,max:selectedScores.length?Math.max(...selectedScores):null,avg:selectedScores.length?Math.round(selectedScores.reduce((a,b)=>a+b,0)/selectedScores.length):null},
      omittedPriorityScore:{max:omittedScores.length?Math.max(...omittedScores):null},
      principle:'Källor som historiskt ger relevanta och färska fynd får större del av uppdateringsbudgeten. Konkurrentkällor skyddas och en separat utforskningsandel roterar så att nya källor fortfarande kan bevisa sitt värde.',
    },
  };
}
