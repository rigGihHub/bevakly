import type { CaseSnapshot } from './case-history';
import type { SignalTimeline } from './signal-timeline';
import type { StrategicDelta } from './strategic-delta';
import type { WhyItMatters } from './why-it-matters';

export type EvidenceDrilldownFact={
  title:string; url:string; source:string; publishedAt:string; stage:string; caseKey:string;
};
export type EvidenceDrilldown={
  id:string; competitor:string; theme:StrategicDelta['theme'];
  claim:string;
  observedFacts:EvidenceDrilldownFact[];
  linkLogic:string[];
  assessment:string[];
  missingEvidence:string[];
  evidenceCoverage:{currentCases:number;linkedCases:number;sourceCount:number;hasOriginalLinks:boolean};
  confidence:StrategicDelta['confidence'];
  guardrails:string[];
};

function deltaClaim(d:StrategicDelta){
  const direction=d.direction==='surging'?'accelererar tydligt':d.direction==='new-pattern'?'visar ett nytt observerat mönster':d.direction==='rising'?'ökar':d.direction==='falling'?'är lägre än baslinjen':'är stabil';
  return `${d.competitor}: observerad aktivitet inom ${d.theme} ${direction} jämfört med den egna observerade baslinjen.`;
}
function dedupeFacts(rows:EvidenceDrilldownFact[]){
  const seen=new Set<string>();
  return rows.filter(x=>{const key=x.url||`${x.title}|${x.source}|${x.publishedAt}`;if(seen.has(key))return false;seen.add(key);return true;});
}

export function buildEvidenceDrilldowns(args:{deltas:StrategicDelta[];snapshots:CaseSnapshot[];timelines:SignalTimeline[];why:WhyItMatters[]}):EvidenceDrilldown[]{
  const timelineById=new Map(args.timelines.map(x=>[x.id,x] as const));
  const whyByTimeline=new Map(args.why.map(x=>[x.timelineId,x] as const));
  const snapshotByCase=new Map<string,CaseSnapshot[]>();
  for(const s of args.snapshots){const list=snapshotByCase.get(s.caseKey)??[];list.push(s);snapshotByCase.set(s.caseKey,list);}

  return args.deltas.map(d=>{
    const recentSnapshots=d.evidenceCaseKeys.flatMap(k=>snapshotByCase.get(k)??[]);
    const latestByCase=new Map<string,CaseSnapshot>();
    for(const s of recentSnapshots){const prev=latestByCase.get(s.caseKey);if(!prev||+new Date(s.observedAt)>+new Date(prev.observedAt))latestByCase.set(s.caseKey,s);}
    const facts:EvidenceDrilldownFact[]=[];
    const linkedWhy:WhyItMatters[]=[];
    for(const [caseKey,s] of latestByCase){
      const timeline=timelineById.get(s.timelineId);
      if(timeline){
        for(const m of timeline.milestones)facts.push({title:m.title,url:m.url,source:m.source,publishedAt:m.publishedAt,stage:m.stage,caseKey});
        const why=whyByTimeline.get(timeline.id);if(why)linkedWhy.push(why);
      }
    }
    const observedFacts=dedupeFacts(facts).sort((a,b)=>+new Date(b.publishedAt)-+new Date(a.publishedAt)).slice(0,12);
    const sources=new Set(observedFacts.map(x=>x.source).filter(Boolean));
    const linkLogic=[...d.reasons];
    if(latestByCase.size)linkLogic.push(`${latestByCase.size} separata case i det aktuella delta-underlaget hålls isär via caseKey innan förändringstakten räknas.`);
    if(observedFacts.length)linkLogic.push(`${observedFacts.length} källhändelser kan spåras till aktuella signaltidslinjer.`);
    else linkLogic.push('Historiska case bidrar till delta-mätningen, men deras ursprungliga källhändelser finns inte i aktuell körnings tidslinjer.');

    const assessment=[...new Set(linkedWhy.flatMap(x=>[x.assessment.market,x.assessment.competitor]))].slice(0,4);
    const missingEvidence:string[]=[];
    if(observedFacts.length===0)missingEvidence.push('Originalkällor för de historiska case som ligger bakom förändringsmätningen behöver återkopplas till persistent case history.');
    if(sources.size<2)missingEvidence.push('Minst två tydligt oberoende källor saknas i den aktuellt öppningsbara evidensen.');
    if(!d.recentStages.some(x=>['formal-process','decision-or-award','execution'].includes(x)))missingEvidence.push('Formellt process-, besluts- eller genomförandesteg saknas i det senaste fönstret.');
    if(d.confidence==='low')missingEvidence.push('Historiken är fortfarande för tunn för hög säkerhet i själva förändringsmätningen.');
    if(linkedWhy.length===0)missingEvidence.push('Ingen separat Why It Matters-bedömning är kopplad till de aktuella case som går att öppna.');

    return {
      id:`${d.competitor}::${d.theme}`,
      competitor:d.competitor,
      theme:d.theme,
      claim:deltaClaim(d),
      observedFacts,
      linkLogic,
      assessment,
      missingEvidence:[...new Set(missingEvidence)],
      evidenceCoverage:{currentCases:d.evidenceCaseKeys.length,linkedCases:latestByCase.size,sourceCount:sources.size,hasOriginalLinks:observedFacts.some(x=>/^https?:\/\//i.test(x.url))},
      confidence:d.confidence,
      guardrails:[d.guardrail,'Öppningsbar evidens från aktuell körning är inte samma sak som full historisk evidens.','Avsaknad av öppningsbar källa får aldrig fyllas ut med ett antagande.'],
    };
  });
}
