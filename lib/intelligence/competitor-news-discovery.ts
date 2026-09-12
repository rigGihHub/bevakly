import type { DiscoveryProviderQuery } from './discovery-provider';

const DEFAULT_COMPETITORS=['PreZero','Ragn-Sells','Stena Recycling','REMONDIS','Verdis','Ohlssons'];

function cleanActor(value:string){
  return value.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
}

export function normalizeCompetitorWatchlist(actors:string[]|null|undefined,max=6){
  const cleaned=(actors??[]).map(cleanActor).filter(Boolean);
  const source=cleaned.length?cleaned:DEFAULT_COMPETITORS;
  return [...new Set(source.map(x=>x.toLocaleLowerCase('sv-SE')))].map(key=>source.find(x=>x.toLocaleLowerCase('sv-SE')===key)!).slice(0,max);
}

export function buildCompetitorNewsQueue(actors:string[]|null|undefined,now=new Date(),maxQueries=6):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  return normalizeCompetitorWatchlist(actors,maxQueries).slice(0,Math.max(0,maxQueries)).map((actor,index)=>({
    jobId:`${day}:competitor-news:${index}:${actor.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,'-')}`,
    targetId:`competitor-news:${actor}`,
    targetName:`${actor} – nyheter`,
    county:null,
    intent:'news',
    sourceClass:'news',
    query:`"${actor}" Sverige (avfall OR återvinning OR kontrakt OR upphandling OR investering OR anläggning OR kapacitet OR förvärv OR etablering OR tillstånd OR pris OR rekrytering)`,
  }));
}

export function summarizeCompetitorNewsQueue(queue:DiscoveryProviderQuery[],actors:string[]){
  return {
    enabled:true,
    watchedActors:normalizeCompetitorWatchlist(actors),
    queries:queue.length,
    principle:'Konkurrentnyheter har en reserverad discovery-lane. Träffar måste fortfarande passera samma kvalitets-, färskhets-, provenance- och dedupefilter som övriga nyheter.',
  };
}
