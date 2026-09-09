import type { FusedSignal, FusionSourceClass } from './signal-fusion';
import { assessCrossSignalEscalation, type CrossSignalEscalation } from './cross-signal-escalation';

export type SignalStage='first-signal'|'corroborating'|'formal-process'|'decision-or-award'|'execution';
export type SignalDirection='escalating'|'stable'|'cooling';
export type TimelineEvidence={title:string;url:string;source:string;sourceClass:FusionSourceClass;publishedAt:string;stage:SignalStage};
export type SignalTimeline={
  id:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  firstSeen:string;
  latestSeen:string;
  ageDays:number;
  stage:SignalStage;
  direction:SignalDirection;
  escalationScore:number;
  interpretationConfidence:'Låg'|'Medel'|'Hög';
  facts:number;
  sourceClasses:FusionSourceClass[];
  milestones:TimelineEvidence[];
  reasons:string[];
  watchNext:string[];
  crossSignal:CrossSignalEscalation;
};

const formal=/(samråd|miljötillstånd|miljöpröv|detaljplan|planbesked|bygglov|ansökan|ärendelista|protokoll|tjänsteutlåtande|domstol|överklag)/i;
const decision=/(beslut|bevilj|godkänn|tilldelning|kontrakt|avtal teckn|företagskoncentration|förvärv)/i;
const execution=/(byggstart|driftsätt|invig|öppnar|startar verksam|produktion start|trafikstart|uppdrag start)/i;
const early=/(rekryter|jobb|platschef|produktionschef|account manager|markköp|etabler|investering|kommande uppdrag)/i;

function stageOf(text:string,sourceClass:FusionSourceClass):SignalStage{
  if(execution.test(text))return 'execution';
  if(decision.test(text))return 'decision-or-award';
  if(formal.test(text)||['environmental','legal','planning','municipal','competition'].includes(sourceClass))return 'formal-process';
  if(early.test(text)||sourceClass==='jobs')return 'first-signal';
  return 'corroborating';
}
function stageRank(stage:SignalStage){return stage==='execution'?5:stage==='decision-or-award'?4:stage==='formal-process'?3:stage==='corroborating'?2:1;}
function daysBetween(a:string,b:string){return Math.max(0,Math.round((new Date(b).getTime()-new Date(a).getTime())/86400000));}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

export function buildSignalTimelines(fusions:FusedSignal[],now=new Date(),limit=12):SignalTimeline[]{
  return fusions.map(fusion=>{
    const milestones=fusion.facts.map(f=>({...f,stage:stageOf(f.title,f.sourceClass)})).sort((a,b)=>new Date(a.publishedAt).getTime()-new Date(b.publishedAt).getTime());
    const stage=milestones.reduce<SignalStage>((best,m)=>stageRank(m.stage)>stageRank(best)?m.stage:best,'first-signal');
    const ageDays=daysBetween(fusion.latestSeen,now.toISOString());
    const formalCount=milestones.filter(x=>stageRank(x.stage)>=3).length;
    const distinctClasses=new Set(milestones.map(x=>x.sourceClass)).size;
    const crossSignal=assessCrossSignalEscalation(milestones.map(x=>({stage:x.stage,sourceClass:x.sourceClass,source:x.source,publishedAt:x.publishedAt})));
    let score=20+Math.min(20,(fusion.eventCount-1)*6)+Math.min(16,(distinctClasses-1)*6)+Math.min(16,formalCount*6)+Math.max(0,(stageRank(stage)-1)*5)+crossSignal.corroborationBonus;
    if(fusion.interpretationConfidence==='Hög')score+=8;
    if(ageDays>30)score-=15; else if(ageDays>14)score-=7;
    score=clamp(Math.round(score),0,crossSignal.scoreCap);
    const direction:SignalDirection=ageDays>30?'cooling':crossSignal.escalating?'escalating':'stable';
    const reasons=[...fusion.reasons];
    if(formalCount)reasons.push(`${formalCount} signal${formalCount===1?'':'er'} har nått formell process/beslut/exekvering`);
    if(direction==='escalating')reasons.push('Oberoende evidens visar faktisk progression mellan flera processsteg');
    reasons.push(...crossSignal.reasons);
    if(direction==='cooling')reasons.push(`Ingen ny signal i fusionen på ${ageDays} dagar – bedömningen kyls ned, inte avskrivs`);
    const watchNext=stage==='first-signal'?['Kommunala plan-/markärenden','Miljösamråd och tillstånd','Fler rekryteringar eller kontraktsbesked']
      :stage==='corroborating'?['Formell ansökan eller myndighetsärende','Kommunalt beslut','Konkurrentens egna besked']
      :stage==='formal-process'?['Beslut, villkor och överklaganden','Tilldelning/avtal','Byggstart eller driftsättning']
      :stage==='decision-or-award'?['Genomförande och driftsättning','Rekrytering och operativ uppskalning','Faktisk kapacitets-/marknadseffekt']
      :['Kapacitetsutfall','Nya kontrakt och kundrörelser','Konkurrentreaktioner'];
    return {id:`timeline-${fusion.id}`,headline:fusion.headline,competitors:fusion.competitors,geographies:fusion.geographies,firstSeen:fusion.firstSeen,latestSeen:fusion.latestSeen,ageDays,stage,direction,escalationScore:score,interpretationConfidence:fusion.interpretationConfidence,facts:fusion.eventCount,sourceClasses:fusion.sourceClasses,milestones,reasons,watchNext,crossSignal};
  }).sort((a,b)=>b.escalationScore-a.escalationScore||new Date(b.latestSeen).getTime()-new Date(a.latestSeen).getTime()).slice(0,Math.max(1,limit));
}

export function summarizeSignalTimelines(items:SignalTimeline[]){
  return {
    total:items.length,
    escalating:items.filter(x=>x.direction==='escalating').length,
    stable:items.filter(x=>x.direction==='stable').length,
    cooling:items.filter(x=>x.direction==='cooling').length,
    formalOrLater:items.filter(x=>stageRank(x.stage)>=3).length,
    highEscalation:items.filter(x=>x.escalationScore>=75).length,
    persistence:'current-run fusion only; cross-run persistence is not claimed until production database history is verified',
  };
}
