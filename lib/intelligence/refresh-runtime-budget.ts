import type { AdaptiveSourcePlanItem } from './adaptive-source-crawl';

export type RefreshDeadlines={sources:number;articles:number;discovery:number;total:number};

function hash(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function rotated<T extends {source:{id:string}}>(items:T[],key:string){return [...items].sort((a,b)=>hash(`${key}|${a.source.id}`)-hash(`${key}|${b.source.id}`));}

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
 * Selects a bounded hourly crawl slice. All verified competitor sources stay in the fast lane;
 * the remaining priority, standard and exploration sources rotate so a refresh cannot synchronously
 * fan out to the whole network while lower-ranked sources still receive coverage over time.
 */
export function buildRefreshSourceBudget(plan:AdaptiveSourcePlanItem[],now=new Date(),maxSources=36){
  const cap=Math.max(8,Math.min(plan.length,maxSources));
  const rotationKey=now.toISOString().slice(0,13);
  const selected:AdaptiveSourcePlanItem[]=[];const ids=new Set<string>();
  const add=(items:AdaptiveSourcePlanItem[],limit:number)=>{
    for(const item of items){if(selected.length>=cap||limit<=0)break;if(ids.has(item.source.id))continue;selected.push(item);ids.add(item.source.id);limit--;}
  };
  add(rotated(plan.filter(x=>x.source.type==='competitor'),rotationKey),cap);
  add(rotated(plan.filter(x=>x.lane==='priority'),rotationKey),Math.max(0,12-selected.length));
  add(rotated(plan.filter(x=>x.lane==='standard'),rotationKey),8);
  add(rotated(plan.filter(x=>x.lane==='explore'),rotationKey),4);
  add(rotated(plan,rotationKey),cap-selected.length);
  const omitted=plan.filter(x=>!ids.has(x.source.id));
  const count=(items:AdaptiveSourcePlanItem[],lane:AdaptiveSourcePlanItem['lane'])=>items.filter(x=>x.lane===lane).length;
  return {
    selected,
    diagnostics:{
      configured:plan.length,selected:selected.length,omitted:omitted.length,rotation:'hourly deterministic',maxSources:cap,
      selectedByLane:{priority:count(selected,'priority'),standard:count(selected,'standard'),explore:count(selected,'explore')},
      omittedByLane:{priority:count(omitted,'priority'),standard:count(omitted,'standard'),explore:count(omitted,'explore')},
      protectedCompetitors:selected.filter(x=>x.source.type==='competitor').length,
      principle:'Varje synkron uppdatering har en fast källbudget. Verifierade konkurrentkällor skyddas; övriga källor roterar per timme.',
    },
  };
}
