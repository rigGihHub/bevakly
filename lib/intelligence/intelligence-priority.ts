import type { SignalTimeline } from './signal-timeline';
import type { WhyItMatters } from './why-it-matters';
import type { SourceGapResult } from './source-gap';
import type { CoolingAssessment } from './negative-evidence-cooling';
import type { CaseEvolution } from './case-evolution';

export type IntelligencePriorityLevel='Kritisk'|'Hög'|'Medel'|'Låg';

export type IntelligencePriority={
  timelineId:string;
  headline:string;
  priorityScore:number;
  priorityLevel:IntelligencePriorityLevel;
  escalationComponent:number;
  impactComponent:number;
  evidenceComponent:number;
  momentumComponent:number;
  recencyComponent:number;
  coolingAdjustment:number;
  interpretationConfidence:'Låg'|'Medel'|'Hög';
  reasons:string[];
  watchNext:string[];
  guardrail:string;
};

function clamp(n:number,min=0,max=100){return Math.max(min,Math.min(max,n));}
function impactScore(level:WhyItMatters['impactLevel']|undefined){return level==='Hög'?100:level==='Medel'?65:level==='Låg'?35:25;}
function evidenceScore(gap:SourceGapResult|undefined){
  if(!gap)return 35;
  if(gap.completeness==='Hög')return 100;
  if(gap.completeness==='Medel')return 65;
  const high=gap.missing.filter(x=>x.priority==='Hög').length;
  return clamp(45-high*12,10,45);
}
function momentumScore(evolution:CaseEvolution|undefined,timeline:SignalTimeline){
  if(evolution?.canCompare){
    if(evolution.trend==='strengthening')return clamp(70+Math.max(0,evolution.scoreDelta)*1.5,70,100);
    if(evolution.trend==='weakening')return clamp(35+Math.min(0,evolution.scoreDelta),10,35);
    if(evolution.trend==='mixed')return 55;
    return 50;
  }
  return timeline.direction==='escalating'?70:timeline.direction==='cooling'?25:50;
}
function recencyScore(ageDays:number){return ageDays<=3?100:ageDays<=7?85:ageDays<=14?70:ageDays<=30?45:20;}
function level(score:number,confidence:SignalTimeline['interpretationConfidence'],impact:WhyItMatters['impactLevel']|undefined):IntelligencePriorityLevel{
  // "Kritisk" requires both evidence interpretation confidence and material impact.
  if(score>=82&&confidence==='Hög'&&impact==='Hög')return 'Kritisk';
  if(score>=68&&confidence!=='Låg')return 'Hög';
  if(score>=45)return 'Medel';
  return 'Låg';
}

export function buildIntelligencePriorities(input:{
  timelines:SignalTimeline[];
  why:WhyItMatters[];
  gaps:SourceGapResult[];
  cooling:CoolingAssessment[];
  evolutions:CaseEvolution[];
  caseKeyByTimeline:Map<string,string>;
}):IntelligencePriority[]{
  const whyMap=new Map(input.why.map(x=>[x.timelineId,x] as const));
  const gapMap=new Map(input.gaps.map(x=>[x.timelineId,x] as const));
  const coolingMap=new Map(input.cooling.map(x=>[x.timelineId,x] as const));
  const evolutionMap=new Map(input.evolutions.map(x=>[x.caseKey,x] as const));

  return input.timelines.map(t=>{
    const why=whyMap.get(t.id);
    const gap=gapMap.get(t.id);
    const cooling=coolingMap.get(t.id);
    const caseKey=input.caseKeyByTimeline.get(t.id);
    const evolution=caseKey?evolutionMap.get(caseKey):undefined;

    const baseAttention=cooling?.adjustedAttentionScore??t.escalationScore;
    const escalationComponent=clamp(baseAttention);
    const impactComponent=impactScore(why?.impactLevel);
    const evidenceComponent=evidenceScore(gap);
    const momentumComponent=momentumScore(evolution,t);
    const recencyComponent=recencyScore(t.ageDays);

    let score=
      escalationComponent*0.36+
      impactComponent*0.22+
      evidenceComponent*0.17+
      momentumComponent*0.15+
      recencyComponent*0.10;

    // Confidence is a guardrail, not another source of "probability".
    if(t.interpretationConfidence==='Låg')score=Math.min(score,64);
    score=Math.round(clamp(score));

    const priorityLevel=level(score,t.interpretationConfidence,why?.impactLevel);
    const reasons:string[]=[
      `Signalstyrka/attention bidrar ${Math.round(escalationComponent*0.36)} av 36 möjliga poäng.`,
      `Bedömd affärspåverkan är ${why?.impactLevel??'inte klassad'}.`,
      `Beviskedjans täckning är ${gap?.completeness??'inte klassad'}.`,
    ];
    if(evolution?.canCompare)reasons.push(`Historisk riktning: ${evolution.trend} (${evolution.scoreDelta>=0?'+':''}${evolution.scoreDelta} score).`);
    else reasons.push(`Ingen jämförbar persistent utvecklingshistorik finns för detta case.`);
    if((cooling?.adjustment??0)<0)reasons.push(`Utebliven bekräftelse sänker attention-delen med ${Math.abs(cooling!.adjustment)} poäng före prioriteringsvägningen.`);
    if(t.interpretationConfidence==='Låg')reasons.push('Låg tolkningssäkerhet begränsar maximal prioritet.');

    const watchNext=[
      ...(gap?.missing.filter(x=>x.priority==='Hög').map(x=>x.searchIntent)??[]),
      ...(t.watchNext??[]),
    ].filter((x,i,a)=>Boolean(x)&&a.indexOf(x)===i).slice(0,3);

    return {
      timelineId:t.id,headline:t.headline,priorityScore:score,priorityLevel,
      escalationComponent:Math.round(escalationComponent),
      impactComponent:Math.round(impactComponent),
      evidenceComponent:Math.round(evidenceComponent),
      momentumComponent:Math.round(momentumComponent),
      recencyComponent:Math.round(recencyComponent),
      coolingAdjustment:cooling?.adjustment??0,
      interpretationConfidence:t.interpretationConfidence,
      reasons,watchNext,
      guardrail:'Prioritet betyder vad som bör granskas först. Den är inte en sannolikhet för att hypotesen är sann eller att en framtida händelse inträffar.',
    };
  }).sort((a,b)=>b.priorityScore-a.priorityScore||a.headline.localeCompare(b.headline,'sv'));
}

export function summarizeIntelligencePriorities(items:IntelligencePriority[]){
  return {
    total:items.length,
    critical:items.filter(x=>x.priorityLevel==='Kritisk').length,
    high:items.filter(x=>x.priorityLevel==='Hög').length,
    medium:items.filter(x=>x.priorityLevel==='Medel').length,
    low:items.filter(x=>x.priorityLevel==='Låg').length,
    top:items[0]??null,
    methodology:'36% attention/escalation, 22% impact, 17% evidence completeness, 15% momentum, 10% recency; confidence guardrails cap low-confidence cases.',
  };
}
