import { databaseErrorMessage, ensureOrganization, getDatabase } from '@/lib/server/db';
import type { SourceLearningObservation, SourceLearningScore } from '@/lib/intelligence/source-learning';
import type { CoverageDimension } from '@/lib/intelligence/swedish-coverage-gap';
import type { CoverageSourceHistory } from '@/lib/intelligence/coverage-source-advisor';
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
  coverageSourceLearning:CoverageSourceHistory[];
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


export async function loadIntelligenceLearningSnapshot():Promise<Pick<PersistentIntelligenceStatus,'enabled'|'sourceLearning'|'coverageSourceLearning'|'reason'>>{
  if(!getDatabase()) return {enabled:false,sourceLearning:[],coverageSourceLearning:[],reason:'DATABASE_URL saknas. Historisk crawl-budget använder endast processminne.'};
  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql) return {enabled:false,sourceLearning:[],coverageSourceLearning:[],reason:'Databasanslutning saknas.'};
    const rows=await sql`
      select source_key,observed_at,ok,hits,primary_items,confirmation_contributions
      from source_run_observations
      where organization_id=${organizationId}::uuid and observed_at >= now() - interval '180 days'
      order by observed_at asc
    `;
    const history:SourceLearningObservation[]=rows.map((row:any)=>({
      sourceId:String(row.source_key),observedAt:new Date(row.observed_at).toISOString(),ok:Boolean(row.ok),hits:Number(row.hits??0),
      primaryItems:Number(row.primary_items??0),confirmationContributions:Number(row.confirmation_contributions??0),
    }));
    const observationRows=await sql`
      select observed_at,event_url,title,source_name,published_at,category,relevance_score,geographies,competitors
      from intelligence_observations
      where organization_id=${organizationId}::uuid and coalesce(published_at,observed_at) >= now() - interval '180 days'
      order by coalesce(published_at,observed_at) asc
    `;
    const coverageMap=new Map<string,CoverageSourceHistory>();
    const dimensionFrom=(category:string,title:string):CoverageDimension=>{
      const hay=`${category} ${title}`.toLocaleLowerCase('sv-SE');
      if(/upphandling|tilldel|kontrakt|avtal|entrepren|rfi|marknadsdialog|option|förläng/.test(hay)) return 'procurement';
      if(/tillstånd|miljöpröv|samråd|kungörelse|överpröv|domstol/.test(hay)) return 'permits';
      if(/prezero|ragn-sells|stena recycling|remondis|verdis|ohlssons|konkurrent/.test(hay)) return 'competitors';
      if(/anläggning|kapacitet|omlastning|återvinningscentral|deponi|förbränning|driftstart|byggstart|investering/.test(hay)) return 'facilities';
      return 'media';
    };
    for(const row of observationRows as any[]){
      const dimension=dimensionFrom(String(row.category??''),String(row.title??''));
      const geographies=Array.isArray(row.geographies)?row.geographies:[];
      const sourceName=String(row.source_name??'Okänd'); const observedAt=new Date(row.observed_at).toISOString();
      const publishedAt=row.published_at?new Date(row.published_at).toISOString():null; const eventDate=publishedAt??observedAt;
      for(const county of geographies){
        const key=`${sourceName}|${county}|${dimension}`;
        const current=coverageMap.get(key)??{sourceName,county:String(county),dimension,events:0,recentEvents:0,lastSeenAt:null,score:0};
        current.events++; if(Date.now()-new Date(eventDate).getTime()<=90*86400000)current.recentEvents++;
        if(!current.lastSeenAt||eventDate>current.lastSeenAt)current.lastSeenAt=eventDate; coverageMap.set(key,current);
      }
    }
    const dailyHistory=[...new Map(history.map(item=>[`${item.sourceId}|${item.observedAt.slice(0,10)}`,item] as const)).values()];
    const coverageSourceLearning=[...coverageMap.values()].map(x=>({...x,score:Math.min(100,Math.round(x.events*12+x.recentEvents*10+(x.lastSeenAt&&Date.now()-new Date(x.lastSeenAt).getTime()<=30*86400000?15:0)))}));
    return {enabled:true,sourceLearning:buildSourceLearning(dailyHistory),coverageSourceLearning,reason:null};
  }catch(error){return {enabled:false,sourceLearning:[],coverageSourceLearning:[],reason:databaseErrorMessage(error)};}
}

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
  if(!getDatabase()) return {enabled:false,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],coverageSourceLearning:[],reason:'DATABASE_URL saknas. Historiken stannar lokalt i webbläsaren.'};

  try{
    const {sql,organizationId}=await ensureOrganization();
    if(!sql) return {enabled:false,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],coverageSourceLearning:[],reason:'DATABASE_URL saknas.'};

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

    const dailyHistory=[...new Map(history.map(item=>{
      const day=item.observedAt.slice(0,10);
      return [`${item.sourceId}|${day}`,item] as const;
    })).values()];
    const dimensionFrom=(category:string,title:string):CoverageDimension=>{
      const hay=`${category} ${title}`.toLocaleLowerCase('sv-SE');
      if(/upphandling|tilldel|kontrakt|avtal|entrepren|rfi|marknadsdialog|option|förläng/.test(hay)) return 'procurement';
      if(/tillstånd|miljöpröv|samråd|kungörelse|överpröv|domstol/.test(hay)) return 'permits';
      if(/prezero|ragn-sells|stena recycling|remondis|verdis|ohlssons|konkurrent/.test(hay)) return 'competitors';
      if(/anläggning|kapacitet|omlastning|återvinningscentral|deponi|förbränning|driftstart|byggstart|investering/.test(hay)) return 'facilities';
      return 'media';
    };
    const coverageMap=new Map<string,CoverageSourceHistory>();
    for(const observation of observations){
      const dimension=dimensionFrom(observation.category??'',observation.title);
      for(const county of observation.geographies){
        const key=`${observation.sourceName??'Okänd'}|${county}|${dimension}`;
        const current=coverageMap.get(key)??{sourceName:observation.sourceName??'Okänd',county,dimension,events:0,recentEvents:0,lastSeenAt:null,score:0};
        current.events++;
        const eventDate=observation.publishedAt??observation.observedAt;
        if(Date.now()-new Date(eventDate).getTime()<=90*86400000) current.recentEvents++;
        if(!current.lastSeenAt||eventDate>current.lastSeenAt) current.lastSeenAt=eventDate;
        coverageMap.set(key,current);
      }
    }
    const coverageSourceLearning=[...coverageMap.values()].map(x=>({...x,score:Math.min(100,Math.round(x.events*12+x.recentEvents*10+(x.lastSeenAt&&Date.now()-new Date(x.lastSeenAt).getTime()<=30*86400000?15:0)))})).sort((a,b)=>b.score-a.score||b.events-a.events);
    return {enabled:true,savedSourceRuns,savedEventObservations,sourceLearning:buildSourceLearning(dailyHistory),historicalChanges:buildHistoricalChanges(observations),competitorBaselines:buildCompetitorBaselines(observations),coverageSourceLearning,reason:null};
  }catch(error){
    return {enabled:false,savedSourceRuns:0,savedEventObservations:0,sourceLearning:[],historicalChanges:[],competitorBaselines:[],coverageSourceLearning:[],reason:databaseErrorMessage(error)};
  }
}
