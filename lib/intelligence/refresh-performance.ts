export type RefreshPhase='sources'|'articles'|'discovery';
export type RefreshTiming={sources?:number;articles?:number;discovery?:number};

export type RefreshPerformance={
  slowest:RefreshPhase|null;
  slowestMs:number;
  totalMeasuredMs:number;
  shares:Record<RefreshPhase,number>;
  status:'fast'|'watch'|'slow';
};

const phases:RefreshPhase[]=['sources','articles','discovery'];

export function assessRefreshPerformance(timing:RefreshTiming,totalBudgetMs=45_000):RefreshPerformance{
  const values=phases.map(phase=>[phase,Math.max(0,timing[phase]??0)] as const);
  const totalMeasuredMs=values.reduce((sum,[,ms])=>sum+ms,0);
  const [slowest,slowestMs]=[...values].sort((a,b)=>b[1]-a[1])[0]??[null,0];
  const shares={sources:0,articles:0,discovery:0};
  for(const [phase,ms] of values)shares[phase]=totalMeasuredMs?Math.round(ms/totalMeasuredMs*100):0;
  const ratio=totalBudgetMs>0?totalMeasuredMs/totalBudgetMs:0;
  return {slowest,slowestMs,totalMeasuredMs,shares,status:ratio>=.8?'slow':ratio>=.55?'watch':'fast'};
}
