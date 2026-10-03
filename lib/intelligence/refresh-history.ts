import { assessRefreshPerformance, type RefreshTiming } from './refresh-performance';

export const REFRESH_HISTORY_LIMIT=40;
export const REFRESH_HISTORY_MIN_RUNS=5;
export type RefreshStage='sources'|'articles'|'discovery'|'other';
export type RefreshRun={
  runId:string;observedAt:string;elapsedMs:number;totalBudgetMs:number;
  phaseMs:Required<RefreshTiming>;
};
export type RefreshHistorySummary={
  runs:number;minimumRuns:number;status:'collecting'|'ready';
  medianElapsedMs:number|null;p90ElapsedMs:number|null;slowRuns:number;
  medianPhaseMs:Record<RefreshStage,number|null>;
  bottleneck:RefreshStage|null;bottleneckRuns:number;
  latestAt:string|null;
};

export function validRefreshRun(run:RefreshRun){
  const values=[run.elapsedMs,run.totalBudgetMs,...Object.values(run.phaseMs)];
  return Boolean(run.runId)&&Number.isFinite(Date.parse(run.observedAt))&&
    values.every(ms=>Number.isFinite(ms)&&ms>=0)&&run.totalBudgetMs>0&&
    ['sources','articles','discovery'].every(phase=>typeof run.phaseMs[phase as keyof RefreshTiming]==='number')&&
    run.elapsedMs>=run.phaseMs.sources+run.phaseMs.articles+run.phaseMs.discovery;
}

export function refreshHistoryContext(industry:string,mode:'full'|'special',days:number,actors:string[],version:string){
  return JSON.stringify({industry,mode,days,actors:[...new Set(actors.map(x=>x.trim().toLocaleLowerCase('sv-SE')).filter(Boolean))].sort(),version});
}

function median(values:number[]){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);
  return Math.round(sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2);
}

export function summarizeRefreshHistory(input:RefreshRun[]):RefreshHistorySummary{
  const seen=new Set<string>();
  const runs=input.filter(validRefreshRun).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt))
    .filter(run=>{if(seen.has(run.runId))return false;seen.add(run.runId);return true;}).slice(0,REFRESH_HISTORY_LIMIT);
  const stages:RefreshStage[]=['sources','articles','discovery','other'];
  const samples=runs.map(run=>{
    const performance=assessRefreshPerformance(run.phaseMs,run.totalBudgetMs,run.elapsedMs);
    const values={...run.phaseMs,other:performance.otherMs};
    const max=Math.max(...Object.values(values));
    // Tied or negligible phases do not establish a unique bottleneck.
    const winners=stages.filter(stage=>values[stage]===max);
    return {run,performance,values,winner:max>0&&winners.length===1?winners[0]:null};
  });
  const counts=Object.fromEntries(stages.map(stage=>[stage,samples.filter(s=>s.winner===stage).length])) as Record<RefreshStage,number>;
  const candidate=[...stages].sort((a,b)=>counts[b]-counts[a])[0];
  const ready=runs.length>=REFRESH_HISTORY_MIN_RUNS;
  const bottleneck=ready&&counts[candidate]/runs.length>=.6?candidate:null;
  const elapsed=runs.map(r=>r.elapsedMs).sort((a,b)=>a-b);
  return {
    runs:runs.length,minimumRuns:REFRESH_HISTORY_MIN_RUNS,status:ready?'ready':'collecting',
    medianElapsedMs:median(elapsed),p90ElapsedMs:elapsed.length?elapsed[Math.ceil(elapsed.length*.9)-1]:null,
    slowRuns:samples.filter(s=>s.performance.status==='slow').length,
    medianPhaseMs:Object.fromEntries(stages.map(stage=>[stage,median(samples.map(s=>s.values[stage]))])) as Record<RefreshStage,number|null>,
    bottleneck,bottleneckRuns:bottleneck?counts[bottleneck]:0,latestAt:runs[0]?.observedAt??null,
  };
}
