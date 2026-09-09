import type { CaseSnapshot } from './case-history';
import type { SourceGapResult } from './source-gap';
import type { SignalTimeline } from './signal-timeline';

export type CoolingLevel='ingen'|'bevaka'|'svalnar'|'tydligt-svalnar';

export type CoolingAssessment={
  timelineId:string;
  caseKey:string|null;
  level:CoolingLevel;
  adjustment:number;
  adjustedAttentionScore:number;
  persistentDays:number|null;
  comparableObservations:number;
  persistentHighPriorityGaps:string[];
  reasons:string[];
  watchNext:string[];
  limitation:string;
};

function days(a:string,b:string){
  return Math.max(0,Math.floor((new Date(b).getTime()-new Date(a).getTime())/86400000));
}
function uniq<T>(v:T[]){return [...new Set(v)];}

const gapClasses:Record<string,string[]>={
  planning:['planning','municipal'],
  environmental:['environmental'],
  legal:['legal'],
  authority:['environmental','competition','municipal','authority','legal'],
  award:['municipal','authority','legal'],
  jobs:['jobs'],
  execution:['news','authority'],
  official:['authority','news'],
  company:['authority','news'],
  independent:['news'],
  followup:['news'],
};

function gapStillAbsent(gapId:string,snapshots:CaseSnapshot[]){
  const classes=gapClasses[gapId]??[];
  if(!classes.length)return false;
  return snapshots.every(s=>!s.sourceClasses.some(c=>classes.includes(c)));
}

export function assessCooling(input:{
  timeline:SignalTimeline;
  gap:SourceGapResult|null;
  history:CaseSnapshot[];
  now?:Date;
}):CoolingAssessment{
  const now=input.now??new Date();
  const related=[...input.history].sort((a,b)=>new Date(a.observedAt).getTime()-new Date(b.observedAt).getTime());
  const caseKey=related[0]?.caseKey??null;
  const comparableObservations=related.length;
  const limitation='Utebliven bekräftelse är inte bevis för att hypotesen är fel. Bedömningen visar endast att Bevakly inte har observerat förväntad bekräftelse i den sparade evidenshistoriken.';
  if(!input.gap||!input.gap.missing.length){
    return {timelineId:input.timeline.id,caseKey,level:'ingen',adjustment:0,adjustedAttentionScore:input.timeline.escalationScore,persistentDays:related.length?days(related[0].observedAt,now.toISOString()):null,comparableObservations,persistentHighPriorityGaps:[],reasons:['Inga aktuella source gaps kräver nedkylning.'],watchNext:[],limitation};
  }
  if(related.length<2){
    return {timelineId:input.timeline.id,caseKey,level:'ingen',adjustment:0,adjustedAttentionScore:input.timeline.escalationScore,persistentDays:null,comparableObservations,persistentHighPriorityGaps:[],reasons:['För få sparade observationer för att tolka en kvarstående bevislucka över tid.'],watchNext:input.gap.missing.slice(0,2).map(x=>x.searchIntent),limitation};
  }

  const persistentDays=days(related[0].observedAt,now.toISOString());
  const persistentHigh=input.gap.missing
    .filter(g=>g.priority==='Hög'&&gapStillAbsent(g.id,related))
    .map(g=>g.id);
  const labels=input.gap.missing.filter(g=>persistentHigh.includes(g.id)).map(g=>g.label);

  if(!persistentHigh.length){
    return {timelineId:input.timeline.id,caseKey,level:'ingen',adjustment:0,adjustedAttentionScore:input.timeline.escalationScore,persistentDays,comparableObservations,persistentHighPriorityGaps:[],reasons:['Ingen högprioriterad bevislucka kan visas ha varit kvar genom hela den sparade historiken.'],watchNext:input.gap.missing.slice(0,2).map(x=>x.searchIntent),limitation};
  }

  let level:CoolingLevel='bevaka';
  let perGap=0;
  if(persistentDays>=90){level='tydligt-svalnar';perGap=10;}
  else if(persistentDays>=60){level='svalnar';perGap=6;}
  else if(persistentDays>=30){level='bevaka';perGap=2;}
  const adjustment=-Math.min(25,perGap*persistentHigh.length);
  const reasons=[
    `${labels.length} högprioriterad bevislucka${labels.length===1?'':'or'} har varit frånvarande i samtliga ${related.length} sparade observationer.`,
    `Den sparade observationsperioden är ${persistentDays} dagar.`,
  ];
  if(persistentDays<30)reasons.push('Observationsperioden är ännu för kort för poängmässig nedkylning.');
  else reasons.push(`Attention score justeras ${adjustment} poäng för kvarstående utebliven bekräftelse; detta är inte en sannolikhet.`);

  return {
    timelineId:input.timeline.id,caseKey,level,adjustment,
    adjustedAttentionScore:Math.max(0,input.timeline.escalationScore+adjustment),
    persistentDays,comparableObservations,
    persistentHighPriorityGaps:uniq(persistentHigh),
    reasons,
    watchNext:input.gap.missing.filter(g=>persistentHigh.includes(g.id)).slice(0,3).map(x=>x.searchIntent),
    limitation,
  };
}

export function buildCoolingAssessments(input:{
  timelines:SignalTimeline[];
  gaps:SourceGapResult[];
  snapshots:CaseSnapshot[];
  caseKeyByTimeline:Map<string,string>;
  now?:Date;
}){
  const gapByTimeline=new Map(input.gaps.map(x=>[x.timelineId,x] as const));
  return input.timelines.map(t=>{
    const caseKey=input.caseKeyByTimeline.get(t.id)??null;
    const history=caseKey?input.snapshots.filter(s=>s.caseKey===caseKey):[];
    return assessCooling({timeline:t,gap:gapByTimeline.get(t.id)??null,history,now:input.now});
  }).sort((a,b)=>a.adjustedAttentionScore-b.adjustedAttentionScore||Number(b.persistentDays??0)-Number(a.persistentDays??0));
}

export function summarizeCooling(items:CoolingAssessment[]){
  return {
    total:items.length,
    cooling:items.filter(x=>x.level==='svalnar'||x.level==='tydligt-svalnar').length,
    watch:items.filter(x=>x.level==='bevaka').length,
    adjusted:items.filter(x=>x.adjustment<0).length,
    maxAdjustment:items.length?Math.min(...items.map(x=>x.adjustment)):0,
  };
}
