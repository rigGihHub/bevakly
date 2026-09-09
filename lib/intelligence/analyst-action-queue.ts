import type { IntelligencePriority } from './intelligence-priority';
import type { SourceGapResult } from './source-gap';
import type { WhyItMatters } from './why-it-matters';
import type { CoolingAssessment } from './negative-evidence-cooling';
import type { SignalTimeline } from './signal-timeline';

export type AnalystActionType='review-now'|'verify-source'|'follow-decision'|'find-evidence'|'watch'|'can-wait';
export type AnalystActionUrgency='Nu'|'Idag'|'Bevaka'|'Kan vänta';

export type AnalystAction={
  id:string;
  timelineId:string;
  headline:string;
  type:AnalystActionType;
  urgency:AnalystActionUrgency;
  label:string;
  reason:string;
  priorityScore:number;
  priorityLevel:IntelligencePriority['priorityLevel'];
  searchIntent:string|null;
  watchNext:string[];
  evidenceLinks:Array<{title:string;url:string;source:string}>;
  guardrail:string;
};

function actionFor(input:{
  priority:IntelligencePriority;
  timeline:SignalTimeline;
  gap?:SourceGapResult;
  why?:WhyItMatters;
  cooling?:CoolingAssessment;
}):Omit<AnalystAction,'id'|'timelineId'|'headline'|'priorityScore'|'priorityLevel'|'evidenceLinks'|'guardrail'>{
  const {priority,timeline,gap,cooling}=input;
  const highGap=gap?.missing.find(x=>x.priority==='Hög');

  if(priority.priorityLevel==='Kritisk'){
    return {type:'review-now',urgency:'Nu',label:'Granska nu',reason:'Högsta prioritet kräver mänsklig genomgång av beviskedja, konsekvens och nästa verifieringspunkt.',searchIntent:highGap?.searchIntent??null,watchNext:priority.watchNext};
  }
  if(priority.priorityLevel==='Hög'&&highGap){
    return {type:'find-evidence',urgency:'Idag',label:'Sök kompletterande evidens',reason:`Caset är högt prioriterat men saknar fortfarande ${highGap.label.toLowerCase()}.`,searchIntent:highGap.searchIntent,watchNext:priority.watchNext};
  }
  if(priority.priorityLevel==='Hög'&&timeline.stage==='formal-process'){
    return {type:'follow-decision',urgency:'Idag',label:'Följ beslut',reason:'Caset har nått formell process och bör följas till beslut, villkor, överklagande eller genomförande.',searchIntent:gap?.nextBestSearch??null,watchNext:priority.watchNext};
  }
  if(priority.interpretationConfidence==='Låg'&&priority.priorityScore>=45){
    return {type:'verify-source',urgency:'Bevaka',label:'Verifiera källa',reason:'Signalens prioritet är relevant men tolkningssäkerheten är låg. Kontrollera originalkälla innan slutsats.',searchIntent:gap?.nextBestSearch??null,watchNext:priority.watchNext};
  }
  if((cooling?.adjustment??0)<0){
    return {type:'watch',urgency:'Bevaka',label:'Bevaka – svalnar',reason:'Förväntad bekräftelse har inte observerats över tid. Behåll bevakning men låt caset stå tillbaka för starkare förändringar.',searchIntent:gap?.nextBestSearch??null,watchNext:priority.watchNext};
  }
  if(priority.priorityLevel==='Medel'){
    return {type:'watch',urgency:'Bevaka',label:'Bevaka',reason:'Caset är relevant men kräver inte omedelbar analytikerinsats.',searchIntent:highGap?.searchIntent??gap?.nextBestSearch??null,watchNext:priority.watchNext};
  }
  return {type:'can-wait',urgency:'Kan vänta',label:'Kan vänta',reason:'Nuvarande underlag motiverar inte att caset går före starkare signaler.',searchIntent:gap?.nextBestSearch??null,watchNext:priority.watchNext};
}

export function buildAnalystActionQueue(input:{
  priorities:IntelligencePriority[];
  timelines:SignalTimeline[];
  gaps:SourceGapResult[];
  why:WhyItMatters[];
  cooling:CoolingAssessment[];
}):AnalystAction[]{
  const tMap=new Map(input.timelines.map(x=>[x.id,x] as const));
  const gMap=new Map(input.gaps.map(x=>[x.timelineId,x] as const));
  const wMap=new Map(input.why.map(x=>[x.timelineId,x] as const));
  const cMap=new Map(input.cooling.map(x=>[x.timelineId,x] as const));
  const urgencyRank:Record<AnalystActionUrgency,number>={'Nu':4,'Idag':3,'Bevaka':2,'Kan vänta':1};

  return input.priorities.flatMap(priority=>{
    const timeline=tMap.get(priority.timelineId);
    if(!timeline)return [];
    const action=actionFor({priority,timeline,gap:gMap.get(priority.timelineId),why:wMap.get(priority.timelineId),cooling:cMap.get(priority.timelineId)});
    return [{
      id:`action-${priority.timelineId}`,
      timelineId:priority.timelineId,
      headline:priority.headline,
      ...action,
      priorityScore:priority.priorityScore,
      priorityLevel:priority.priorityLevel,
      evidenceLinks:timeline.milestones.slice(-3).reverse().map(x=>({title:x.title,url:x.url,source:x.source})),
      guardrail:'Åtgärdskön är ett analytiskt arbetsstöd. Den utför inga externa åtgärder och gör inte en signal sannare än dess källunderlag.',
    }];
  }).sort((a,b)=>urgencyRank[b.urgency]-urgencyRank[a.urgency]||b.priorityScore-a.priorityScore);
}

export function summarizeAnalystActionQueue(items:AnalystAction[]){
  return {
    total:items.length,
    now:items.filter(x=>x.urgency==='Nu').length,
    today:items.filter(x=>x.urgency==='Idag').length,
    watch:items.filter(x=>x.urgency==='Bevaka').length,
    canWait:items.filter(x=>x.urgency==='Kan vänta').length,
    principle:'Prioritet blir en rekommenderad analytikeråtgärd; kön utför aldrig externa handlingar automatiskt.',
  };
}
