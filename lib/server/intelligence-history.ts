import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { SourceLearningObservation, SourceLearningScore } from '@/lib/intelligence/source-learning';
import { buildSourceLearning } from '@/lib/intelligence/source-learning';
import { buildHistoricalChanges, type HistoricalObservation, type HistoricalChange } from '@/lib/intelligence/historical-change';
import { buildCompetitorBaselines, type CompetitorBaseline } from '@/lib/intelligence/competitor-baseline';

export type PersistentIntelligenceStatus = {
  enabled:boolean;
  savedSourceRuns:number;
  savedEventObservations:number;
  sourceLearning:SourceLearningScore[];
  historicalChanges:HistoricalChange[];
  competitorBaselines:CompetitorBaseline[];
  reason:string|null;
};

type SourceRunInput = {
  id:string;
  name:string;
  ok:boolean;
  hits:number;
  primaryItems:number;
  confirmationContributions:number;
};

type EventObservationInput = {
  url:string;
  title:string;
  source:string;
  publishedAt:string;
  category:string;
  score:number;
  geographies:string[];
  competitors?:string[];
};

export async function persistIntelligenceHistory(
  fetchedAt:string,
  sourceRuns:SourceRunInput[],
  events:EventObservationInput[],
):Promise<PersistentIntelligenceStatus>{
  if(!getDatabase()) return {enabled:false,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],reason:'DATABASE_URL saknas. Historiken stannar lokalt i webbläsaren.'};

  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql) return {enabled:false,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],reason:'DATABASE_URL saknas.'};

    let savedSourceRuns=0;
    for(const source of sourceRuns){
      await sql`
        insert into source_run_observations (
          organization_id,source_key,source_name,observed_at,ok,hits,primary_items,confirmation_contributions
        ) values (
          ${organizationId}::uuid,${source.id},${source.name},${fetchedAt}::timestamptz,
          ${source.ok},${source.hits},${source.primaryItems},${source.confirmationContributions}
        )
        on conflict (organization_id,source_key,observed_at) do update set
          source_name=excluded.source_name,ok=excluded.ok,hits=excluded.hits,
          primary_items=excluded.primary_items,confirmation_contributions=excluded.confirmation_contributions
      `;
      savedSourceRuns++;
    }

    let savedEventObservations=0;
    for(const event of events){
      await sql`
        insert into intelligence_observations (
          organization_id,observation_key,observed_at,event_url,title,source_name,published_at,
          category,relevance_score,geographies,competitors,observation_type
        ) values (
          ${organizationId}::uuid,${event.url},${fetchedAt}::timestamptz,${event.url},${event.title},
          ${event.source},${event.publishedAt}::timestamptz,${event.category},${event.score},
          ${JSON.stringify(event.geographies)}::jsonb,${JSON.stringify(event.competitors??[])}::jsonb,'market_event'
        )
        on conflict (organization_id,observation_key,observed_at) do update set
          title=excluded.title,source_name=excluded.source_name,published_at=excluded.published_at,
          category=excluded.category,relevance_score=excluded.relevance_score,
          geographies=excluded.geographies,competitors=excluded.competitors
      `;
      savedEventObservations++;
    }

    const rows=await sql`
      select source_key,observed_at,ok,hits,primary_items,confirmation_contributions
      from source_run_observations
      where organization_id=${organizationId}::uuid
        and observed_at >= now() - interval '180 days'
      order by observed_at asc
    `;
    const history:SourceLearningObservation[]=rows.map((row:any)=>({
      sourceId:String(row.source_key),
      observedAt:new Date(row.observed_at).toISOString(),
      ok:Boolean(row.ok),
      hits:Number(row.hits??0),
      primaryItems:Number(row.primary_items??0),
      confirmationContributions:Number(row.confirmation_contributions??0),
    }));

    const observationRows=await sql`
      select observed_at,event_url,title,source_name,published_at,category,relevance_score,geographies,competitors
      from intelligence_observations
      where organization_id=${organizationId}::uuid
        and coalesce(published_at,observed_at) >= now() - interval '180 days'
      order by coalesce(published_at,observed_at) asc
    `;
    const observations:HistoricalObservation[]=observationRows.map((row:any)=>({
      observedAt:new Date(row.observed_at).toISOString(),
      publishedAt:row.published_at?new Date(row.published_at).toISOString():null,
      title:String(row.title??''),
      category:row.category?String(row.category):null,
      relevanceScore:row.relevance_score===null?null:Number(row.relevance_score),
      geographies:Array.isArray(row.geographies)?row.geographies:[],
      competitors:Array.isArray(row.competitors)?row.competitors:[],
      sourceName:row.source_name?String(row.source_name):null,
      eventUrl:row.event_url?String(row.event_url):null,
    }));

    return {enabled:true,savedSourceRuns,savedEventObservations,sourceLearning:buildSourceLearning(history),historicalChanges:buildHistoricalChanges(observations),competitorBaselines:buildCompetitorBaselines(observations),reason:null};
  }catch(error){
    return {enabled:true,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],reason:databaseErrorMessage(error)};
  }
}
