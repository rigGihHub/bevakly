import { buildEvidenceDrilldowns } from '../lib/intelligence/evidence-drilldown';
import type { StrategicDelta } from '../lib/intelligence/strategic-delta';
import type { CaseSnapshot } from '../lib/intelligence/case-history';
import type { SignalTimeline } from '../lib/intelligence/signal-timeline';

const delta:StrategicDelta={competitor:'PreZero',theme:'capacity',direction:'surging',recentSignals:2,baselineSignals:1,recentRate:2,baselineRate:.33,ratio:6,recentStages:['formal-process'],baselineStages:['first-signal'],latestObservedAt:'2026-09-08T10:00:00Z',evidenceCaseKeys:['case-a','case-b'],reasons:['Observerad takt 2.0/30d jämfört med 0.3/30d i baslinjen.'],confidence:'medium',guardrail:'Delta är observerad aktivitet.'};
const snaps:CaseSnapshot[]=[
 {caseKey:'case-a',timelineId:'timeline-a',headline:'Samråd',competitors:['PreZero'],geographies:['Örebro'],observedAt:'2026-09-08T10:00:00Z',evidenceFirstSeen:'2026-09-01',evidenceLatestSeen:'2026-09-08',stage:'formal-process',direction:'escalating',escalationScore:65,interpretationConfidence:'Medel',facts:2,sourceClasses:['environmental']},
 {caseKey:'case-b',timelineId:'timeline-b',headline:'Historiskt case',competitors:['PreZero'],geographies:['Örebro'],observedAt:'2026-09-07T10:00:00Z',evidenceFirstSeen:'2026-09-03',evidenceLatestSeen:'2026-09-07',stage:'first-signal',direction:'stable',escalationScore:45,interpretationConfidence:'Låg',facts:1,sourceClasses:['news']},
];
const timeline={id:'timeline-a',headline:'Samråd',competitors:['PreZero'],geographies:['Örebro'],firstSeen:'2026-09-01',latestSeen:'2026-09-08',ageDays:0,stage:'formal-process',direction:'escalating',escalationScore:65,interpretationConfidence:'Medel',facts:2,sourceClasses:['environmental'],milestones:[{title:'Länsstyrelsen publicerar samråd',url:'https://example.se/samrad',source:'Länsstyrelsen',sourceClass:'environmental',publishedAt:'2026-09-08',stage:'formal-process'}],reasons:[],watchNext:['Beslut'],crossSignal:{escalating:false,corroborationBonus:0,scoreCap:100,reasons:[]}} as unknown as SignalTimeline;
const out=buildEvidenceDrilldowns({deltas:[delta],snapshots:snaps,timelines:[timeline],why:[]});
const x=out[0];
const checks=[
 ['claim',x.claim.includes('PreZero')&&x.claim.includes('capacity')],
 ['fact link',x.observedFacts.length===1&&x.observedFacts[0].url==='https://example.se/samrad'],
 ['case separation',x.linkLogic.some(v=>v.includes('2 separata case'))],
 ['missing independent source',x.missingEvidence.some(v=>v.includes('oberoende källor'))],
 ['no invented assessment',x.assessment.length===0],
 ['guardrail',x.guardrails.some(v=>v.includes('aldrig fyllas ut'))],
 ['coverage',x.evidenceCoverage.currentCases===2&&x.evidenceCoverage.sourceCount===1],
];
for(const [name,ok] of checks){if(!ok)throw new Error(`FAIL ${name}`);console.log(`PASS ${name}`)}
console.log(`PASS v2.92 ${checks.length}/${checks.length}`);
