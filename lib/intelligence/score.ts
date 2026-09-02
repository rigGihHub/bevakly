import type { SourceType } from "./sources";

export type ScoreBreakdown = { topic:number; geography:number; commercial:number; regulatory:number; strategic:number; freshness:number; sourceQuality:number; competitor:number };
export type ScoredSignal = { score:number; label:"Kritisk"|"Mycket viktig"|"Relevant"|"Bevaka"|"Låg"; breakdown:ScoreBreakdown };
const topicWords=["avfall","återvinn","depon","förpack","plast","textil","insamling","sortering","producentansvar","cirkul"];
const commercialWords=["upphandling","avtal","kontrakt","invest","anläggning","kapacitet","etabler","förvärv","fusion"];
const regulatoryWords=["lag","regler","förordning","miljöbalk","krav","regering","riksdag","myndighet","tillstånd","skatt"];
const strategicWords=["strateg","expansion","rekryter","samarbete","innovation","teknik","marknad"];
function hits(text:string, words:string[]){ const lower=text.toLocaleLowerCase("sv-SE"); return words.filter(w=>lower.includes(w)).length; }
function freshnessPoints(publishedAt?: string|null){ if(!publishedAt) return 2; const age=(Date.now()-new Date(publishedAt).getTime())/86400000; return age<=2?5:age<=7?4:age<=30?3:age<=90?1:0; }
export function scoreSignal(input:{ title:string; body?:string; sourceType:SourceType; trustScore:number; geographyMatches?:number; competitorPriority?:1|2|3|null; publishedAt?:string|null }):ScoredSignal{
 const text=`${input.title} ${input.body??""}`; const priority=input.competitorPriority;
 const breakdown:ScoreBreakdown={
  competitor: priority===1?20:priority===2?14:priority===3?8:0,
  topic:Math.min(15,hits(text,topicWords)*4),
  geography:Math.min(15,(input.geographyMatches??0)*7),
  commercial:Math.min(15,hits(text,commercialWords)*6),
  regulatory:Math.min(15,hits(text,regulatoryWords)*6),
  strategic:Math.min(10,hits(text,strategicWords)*4),
  freshness:freshnessPoints(input.publishedAt),
  sourceQuality:Math.round((input.trustScore/100)*5),
 };
 if(input.sourceType==="authority") breakdown.regulatory=Math.min(15,breakdown.regulatory+3);
 if(input.sourceType==="industry") breakdown.topic=Math.min(15,breakdown.topic+2);
 if(input.sourceType==="competitor") { breakdown.commercial=Math.min(15,breakdown.commercial+3); breakdown.strategic=Math.min(10,breakdown.strategic+2); }
 if(input.sourceType==="procurement") { breakdown.commercial=Math.min(15,breakdown.commercial+9); breakdown.topic=Math.min(15,breakdown.topic+5); breakdown.strategic=Math.min(10,breakdown.strategic+4); }
 const score=Math.min(100,Object.values(breakdown).reduce((a,b)=>a+b,0));
 const label=score>=90?"Kritisk":score>=75?"Mycket viktig":score>=55?"Relevant":score>=35?"Bevaka":"Låg";
 return {score,label,breakdown};
}
