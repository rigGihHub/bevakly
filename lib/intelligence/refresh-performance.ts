export type RefreshPhase='sources'|'articles'|'discovery';
export type RefreshTiming={sources?:number;articles?:number;discovery?:number};

export type RefreshPerformance={
  slowest:RefreshPhase|null;
  slowestMs:number;
  totalMeasuredMs:number;
  elapsedMs:number;
  otherMs:number;
  shares:Record<RefreshPhase,number>;
  status:'fast'|'watch'|'slow';
};

const phases:RefreshPhase[]=['sources','articles','discovery'];

export function assessRefreshPerformance(timing:RefreshTiming,totalBudgetMs=45_000,totalElapsedMs?:number):RefreshPerformance{
  const finiteMs=(value:number|undefined)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,value):0;
  const values=phases.map(phase=>[phase,finiteMs(timing[phase])] as const);
  const totalMeasuredMs=values.reduce((sum,[,ms])=>sum+ms,0);
  const [slowest,slowestMs]=[...values].sort((a,b)=>b[1]-a[1])[0]??[null,0];
  const elapsedMs=Math.max(totalMeasuredMs,finiteMs(totalElapsedMs));
  const otherMs=elapsedMs-totalMeasuredMs;
  const shares={sources:0,articles:0,discovery:0};
  for(const [phase,ms] of values)shares[phase]=totalMeasuredMs?Math.round(ms/totalMeasuredMs*100):0;
  const ratio=Number.isFinite(totalBudgetMs)&&totalBudgetMs>0?elapsedMs/totalBudgetMs:0;
  return {slowest:slowestMs>0?slowest:null,slowestMs,totalMeasuredMs,elapsedMs,otherMs,shares,status:ratio>=.8?'slow':ratio>=.55?'watch':'fast'};
}
