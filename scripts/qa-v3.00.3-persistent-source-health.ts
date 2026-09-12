import { buildAdaptiveSourcePlan, hydrateAdaptiveSourceState, recordAdaptiveSourceOutcomes, adaptiveSourceHealthHistory } from '../lib/intelligence/adaptive-source-crawl.ts';

const sources:any[]=[
 {id:'steady',name:'Steady',type:'media',scope:'regional',tier:2,trustScore:70,enabled:true,url:'https://a.se'},
 {id:'empty',name:'Empty',type:'media',scope:'regional',tier:2,trustScore:70,enabled:true,url:'https://b.se'},
 {id:'fail',name:'Fail',type:'media',scope:'regional',tier:2,trustScore:70,enabled:true,url:'https://c.se'},
];
let pass=0; const test=(ok:boolean,msg:string)=>{if(!ok)throw new Error(msg);pass++;};
const hydrated=hydrateAdaptiveSourceState([
 {sourceId:'steady',runs:8,okRuns:8,totalCandidates:64,totalUnseen:36,totalPrimary:12,totalConfirmations:4,totalTierA:5,totalTierB:5,emptyRuns:0,lastRunAt:'2026-09-10T10:00:00Z'},
 {sourceId:'empty',runs:8,okRuns:8,totalCandidates:0,totalUnseen:0,totalPrimary:0,totalConfirmations:0,totalTierA:0,totalTierB:0,emptyRuns:8,lastRunAt:'2026-09-10T10:00:00Z'},
 {sourceId:'fail',runs:8,okRuns:2,totalCandidates:2,totalUnseen:1,totalPrimary:0,totalConfirmations:0,totalTierA:0,totalTierB:0,emptyRuns:1,lastRunAt:'2026-09-10T10:00:00Z'},
]);
test(hydrated===3,'should hydrate three sources');
const plan=buildAdaptiveSourcePlan(sources,new Date('2026-09-11T10:00:00Z'));
const steady=plan.find(x=>x.source.id==='steady')!, empty=plan.find(x=>x.source.id==='empty')!;
test(steady.priorityScore>empty.priorityScore,'productive history should rank above repeated empty history');
test(plan.length===3,'history must not auto-disable sources');
const before=adaptiveSourceHealthHistory();
test(before.repeatedLowYield>=1,'repeated low yield should be visible');
test(before.repeatedFailures>=1,'repeated failures should be visible separately');
recordAdaptiveSourceOutcomes([{sourceId:'empty',ok:true,candidates:0,unseen:0,acceptedPrimary:0,confirmations:0,tierA:0,tierB:0}],new Date('2026-09-11T11:00:00Z'));
const after=adaptiveSourceHealthHistory();
test(after.trackedSources===3,'runtime should remain bounded by source ids');
test(after.rows.find(x=>x.sourceId==='empty')!.reliability===1,'empty but successful source is not a failed source');
console.log(`Persistent source health QA: ${pass}/7 PASS`);
