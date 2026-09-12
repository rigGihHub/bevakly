import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';

export type CoverageBudgetAuditTelemetry={sourceId:string;sourceName:string;extraCandidateBudget:number;extraCandidatesConsumed:number;acceptedFromExtra:number;gapReasons:string[]};
export type CoverageBudgetHistoryRow={sourceId:string;sourceName:string;runs:number;allocatedExtraCandidates:number;consumedExtraCandidates:number;acceptedFromExtra:number;productiveRuns:number;yieldPer100Consumed:number;lastSeenAt:string};
export type CoverageBudgetHistory={configured:boolean;enabled:boolean;schemaReady:boolean;savedRows:number;days:number;runs:number;allocatedExtraCandidates:number;consumedExtraCandidates:number;acceptedFromExtra:number;productiveRuns:number;yieldPer100Consumed:number;topSources:CoverageBudgetHistoryRow[];reason:string|null;principle:string};

const principle='Historisk effekt mäts över flera körningar. Extra yield avser bara accepterade kandidater utanför ordinarie baseline och får aldrig höja evidensens confidence.';
function off(reason:string,configured=false):CoverageBudgetHistory{return {configured,enabled:false,schemaReady:false,savedRows:0,days:90,runs:0,allocatedExtraCandidates:0,consumedExtraCandidates:0,acceptedFromExtra:0,productiveRuns:0,yieldPer100Consumed:0,topSources:[],reason,principle};}
function enabled(){return process.env.BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED==='true';}

export async function persistCoverageBudgetAudit(rows:CoverageBudgetAuditTelemetry[],observedAt:string){
  if(!enabled())return off('BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED är inte true. Historisk budgetaudit är avstängd.');
  if(!getDatabase())return off('DATABASE_URL saknas.',true);
  try{
    const {sql,organizationId}=await ensureOrganization(); if(!sql)return off('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_coverage_budget_audit limit 1`;
    let savedRows=0;
    for(const r of rows){
      await sql`insert into intelligence_coverage_budget_audit (organization_id,observed_at,source_id,source_name,allocated_extra_candidates,consumed_extra_candidates,accepted_from_extra,gap_reasons)
        values (${organizationId}::uuid,${observedAt}::timestamptz,${r.sourceId},${r.sourceName},${r.extraCandidateBudget},${r.extraCandidatesConsumed},${r.acceptedFromExtra},${JSON.stringify(r.gapReasons)}::jsonb)`;
      savedRows++;
    }
    return {...off('',true),enabled:true,schemaReady:true,savedRows,reason:null};
  }catch(error){return off(databaseErrorMessage(error),true);}
}

export async function loadCoverageBudgetHistory(days=90):Promise<CoverageBudgetHistory>{
  if(!enabled())return off('BEVAKLY_SOURCE_HEALTH_LEARNING_ENABLED är inte true. Historisk budgetaudit är avstängd.');
  if(!getDatabase())return off('DATABASE_URL saknas.',true);
  try{
    const {sql,organizationId}=await ensureOrganization(); if(!sql)return off('Databasanslutning saknas.',true);
    await sql`select 1 from intelligence_coverage_budget_audit limit 1`;
    const d=Math.max(7,Math.min(365,Math.floor(days)));
    const rows=await sql`select source_id,max(source_name) as source_name,count(*)::int as runs,sum(allocated_extra_candidates)::int as allocated,sum(consumed_extra_candidates)::int as consumed,sum(accepted_from_extra)::int as accepted,sum(case when accepted_from_extra>0 then 1 else 0 end)::int as productive,max(observed_at) as last_seen
      from intelligence_coverage_budget_audit where organization_id=${organizationId}::uuid and observed_at>=now()-(${d}::text||' days')::interval group by source_id order by accepted desc, consumed desc`;
    const topSources:CoverageBudgetHistoryRow[]=(rows as any[]).map(r=>({sourceId:String(r.source_id),sourceName:String(r.source_name),runs:Number(r.runs),allocatedExtraCandidates:Number(r.allocated),consumedExtraCandidates:Number(r.consumed),acceptedFromExtra:Number(r.accepted),productiveRuns:Number(r.productive),yieldPer100Consumed:Number(r.consumed)?Math.round(Number(r.accepted)/Number(r.consumed)*10000)/100:0,lastSeenAt:new Date(r.last_seen).toISOString()}));
    const totals=topSources.reduce((a,r)=>({runs:a.runs+r.runs,allocated:a.allocated+r.allocatedExtraCandidates,consumed:a.consumed+r.consumedExtraCandidates,accepted:a.accepted+r.acceptedFromExtra,productive:a.productive+r.productiveRuns}),{runs:0,allocated:0,consumed:0,accepted:0,productive:0});
    return {configured:true,enabled:true,schemaReady:true,savedRows:0,days:d,runs:totals.runs,allocatedExtraCandidates:totals.allocated,consumedExtraCandidates:totals.consumed,acceptedFromExtra:totals.accepted,productiveRuns:totals.productive,yieldPer100Consumed:totals.consumed?Math.round(totals.accepted/totals.consumed*10000)/100:0,topSources:topSources.slice(0,8),reason:null,principle};
  }catch(error){return off(databaseErrorMessage(error),true);}
}
