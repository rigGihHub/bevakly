import { explainImpact } from './impact-explanation';

export type DecisionBriefItem = {
  title:string; url:string; source:string; category:string; score:number; evidence:string;
  independentSourceCount:number; geographies:string[]; competitors?:string[]; publishedAt:string;
};

export type DecisionBrief = {
  title:string;
  reason:string;
  watchNext:string;
  evidence:string;
  url:string;
  source:string;
  score:number;
  badge:string;
};

function priority(item:DecisionBriefItem){
  let p=item.score;
  p+=Math.min(12,item.independentSourceCount*4);
  if(item.competitors?.length) p+=8;
  if(item.geographies.length) p+=4;
  if(/invest|etabler|förvärv|tillstånd|regel|lag|kapacitet/i.test(item.category)) p+=7;
  return p;
}

export function buildDecisionBrief(items:DecisionBriefItem[],limit=3):DecisionBrief[]{
  return [...items]
    .sort((a,b)=>priority(b)-priority(a)||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime())
    .slice(0,limit)
    .map(item=>{
      const impact=explainImpact({category:item.category,score:item.score,evidence:item.evidence,independentSourceCount:item.independentSourceCount,geographies:item.geographies});
      const badge=item.competitors?.length?`Konkurrent · ${item.competitors[0]}`:item.geographies.length?`Marknad · ${item.geographies[0]}`:item.category;
      return {title:item.title,reason:impact.whyItMatters,watchNext:impact.watchNext,evidence:impact.evidenceNote,url:item.url,source:item.source,score:item.score,badge};
    });
}
