import { getDatabase, getOrganizationId } from '@/lib/server/db';
import { summarizeRefreshHistory, validRefreshRun, REFRESH_HISTORY_LIMIT, type RefreshRun, type RefreshHistorySummary } from '@/lib/intelligence/refresh-history';

export type RefreshHistoryResult={
  mode:'database'|'unavailable';saved:boolean;summary:RefreshHistorySummary;reason:string|null;
};

/** One bounded transaction; missing schema or storage failures must never lose the feed. */
export async function recordRefreshHistory(run:RefreshRun,contextKey:string,timeoutMs=750):Promise<RefreshHistoryResult>{
  const unavailable=(reason:string):RefreshHistoryResult=>({mode:'unavailable',saved:false,summary:summarizeRefreshHistory([]),reason});
  if(process.env.BEVAKLY_REFRESH_HISTORY_ENABLED==='false')return unavailable('Historik för uppdateringstider är avstängd.');
  if(!validRefreshRun(run))return unavailable('Körningens tidsmätning är ofullständig.');
  const sql=getDatabase();
  if(!sql)return unavailable('Historik för uppdateringstider är inte konfigurerad.');
  if(timeoutMs<=0)return unavailable('Uppdateringens tidsbudget saknar utrymme för historik.');
  try{
    const organizationId=getOrganizationId();
    const result=await sql.transaction([
      sql`insert into intelligence_refresh_runs (organization_id,run_id,context_key,observed_at,elapsed_ms,total_budget_ms,sources_ms,articles_ms,discovery_ms)
        values (${organizationId}::uuid,${run.runId}::uuid,${contextKey},${run.observedAt}::timestamptz,${run.elapsedMs},${run.totalBudgetMs},${run.phaseMs.sources},${run.phaseMs.articles},${run.phaseMs.discovery})
        on conflict (organization_id,run_id) do nothing`,
      sql`delete from intelligence_refresh_runs where organization_id=${organizationId}::uuid and observed_at<now()-interval '30 days'`,
      sql`select run_id,observed_at,elapsed_ms,total_budget_ms,sources_ms,articles_ms,discovery_ms
        from intelligence_refresh_runs where organization_id=${organizationId}::uuid and context_key=${contextKey} and observed_at>=now()-interval '30 days'
        order by observed_at desc limit ${REFRESH_HISTORY_LIMIT}`,
    ],{fetchOptions:{signal:AbortSignal.timeout(Math.max(1,Math.min(750,timeoutMs)))}});
    const runs=(result[2] as Record<string,unknown>[]).map(row=>({
      runId:String(row.run_id),observedAt:new Date(String(row.observed_at)).toISOString(),
      elapsedMs:Number(row.elapsed_ms),totalBudgetMs:Number(row.total_budget_ms),
      phaseMs:{sources:Number(row.sources_ms),articles:Number(row.articles_ms),discovery:Number(row.discovery_ms)},
    }));
    return {mode:'database',saved:true,summary:summarizeRefreshHistory(runs),reason:null};
  }catch{
    return unavailable('Historik för uppdateringstider kunde inte sparas.');
  }
}
