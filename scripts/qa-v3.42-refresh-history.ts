import assert from 'node:assert/strict';
import { assessRefreshPerformance } from '../lib/intelligence/refresh-performance';
import { refreshHistoryContext, summarizeRefreshHistory, validRefreshRun, type RefreshRun } from '../lib/intelligence/refresh-history';
import { recordRefreshHistory } from '../lib/server/refresh-history';

const run=(i:number,elapsedMs=30_000):RefreshRun=>({runId:`run-${i}`,observedAt:new Date(Date.UTC(2026,9,3,10,i)).toISOString(),elapsedMs,totalBudgetMs:45_000,phaseMs:{sources:2_000,articles:12_000,discovery:3_000}});
assert.equal(assessRefreshPerformance({},45_000).slowest,null);
assert.equal(assessRefreshPerformance({sources:NaN,articles:Infinity}).totalMeasuredMs,0);
assert.equal(assessRefreshPerformance(run(0).phaseMs,45_000,44_000).status,'slow','wall-clock time must include persistence/analysis');
assert.equal(assessRefreshPerformance(run(0).phaseMs,45_000,44_000).otherMs,27_000);
assert.equal(validRefreshRun({...run(0),elapsedMs:10}),false);
assert.equal(validRefreshRun({...run(0),observedAt:'invalid'}),false);

const empty=summarizeRefreshHistory([]);
assert.equal(empty.medianElapsedMs,null);
assert.equal(empty.bottleneck,null);
assert.equal(summarizeRefreshHistory([run(0)]).bottleneck,null,'one run cannot establish a recurring bottleneck');
const samples=[run(0,20_000),run(1,21_000),run(2,22_000),run(3,23_000),run(4,44_000)];
const summary=summarizeRefreshHistory(samples);
assert.equal(summary.medianElapsedMs,22_000,'a single slow outlier must not dominate the median');
assert.equal(summary.p90ElapsedMs,44_000);
assert.equal(summary.slowRuns,1);
assert.equal(summary.bottleneck,'articles');
assert.equal(summary.bottleneckRuns,4);
assert.equal(summarizeRefreshHistory(Array.from({length:5},(_,i)=>run(i,44_000))).bottleneck,'other');
assert.equal(summarizeRefreshHistory([...samples,samples[0],{...run(6),elapsedMs:NaN}]).runs,5);
const bounded=summarizeRefreshHistory(Array.from({length:50},(_,i)=>run(i)));
assert.equal(bounded.runs,40);
assert.equal(bounded.latestAt,run(49).observedAt);
assert.equal(summarizeRefreshHistory(samples.slice(0,4)).status,'collecting');
const ties=samples.map(r=>({...r,elapsedMs:27_000,phaseMs:{sources:12_000,articles:12_000,discovery:3_000}}));
assert.equal(summarizeRefreshHistory(ties).bottleneck,null);

const context=refreshHistoryContext('waste','full',7,['Stena','PreZero'],'3.42.0');
assert.equal(context,refreshHistoryContext('waste','full',7,[' prezero ','Stena','Stena'],'3.42.0'));
for(const other of [
  refreshHistoryContext('ai-tools','special',7,['Stena','PreZero'],'3.42.0'),
  refreshHistoryContext('waste','full',30,['Stena','PreZero'],'3.42.0'),
  refreshHistoryContext('waste','full',7,['Stena'],'3.42.0'),
  refreshHistoryContext('waste','full',7,['Stena','PreZero'],'3.41.0'),
])assert.notEqual(context,other,'incompatible workloads must not share history');

const oldDatabase=process.env.DATABASE_URL,oldEnabled=process.env.BEVAKLY_REFRESH_HISTORY_ENABLED;
try{
  delete process.env.DATABASE_URL;
  const absent=await recordRefreshHistory(run(0),context);
  assert.equal(absent.mode,'unavailable');assert.equal(absent.saved,false);assert.equal(absent.summary.runs,0);
  process.env.BEVAKLY_REFRESH_HISTORY_ENABLED='false';
  assert.equal((await recordRefreshHistory(run(0),context)).saved,false);
}finally{
  if(oldDatabase===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldDatabase;
  if(oldEnabled===undefined)delete process.env.BEVAKLY_REFRESH_HISTORY_ENABLED;else process.env.BEVAKLY_REFRESH_HISTORY_ENABLED=oldEnabled;
}
console.log('v3.42 refresh history: PASS');
