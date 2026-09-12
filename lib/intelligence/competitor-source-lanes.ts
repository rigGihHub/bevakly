import type { DiscoveryProviderQuery } from './discovery-provider';
import { OFFICIAL_COMPETITOR_SOURCES } from './competitor-official-sources';
import { normalizeCompetitorWatchlist } from './competitor-news-discovery';

function slug(v:string){return v.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,'-').replace(/^-|-$/g,'')}
function sourceFor(actor:string){return OFFICIAL_COMPETITOR_SOURCES.find(x=>x.competitor.toLocaleLowerCase('sv-SE')===actor.toLocaleLowerCase('sv-SE'));}

export function buildCompetitorSourceLaneQueue(actors:string[]|null|undefined,now=new Date(),maxQueries=4):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const watched=normalizeCompetitorWatchlist(actors,6);
  const jobs:DiscoveryProviderQuery[]=[];
  for(const actor of watched){
    const source=sourceFor(actor); if(!source?.newsHost) continue;
    jobs.push({jobId:`${day}:competitor-source:${slug(actor)}:official-news`,targetId:`competitor-source:${actor}:official-news`,targetName:`${actor} – officiella nyheter`,county:null,intent:'competitor-official-news',sourceClass:'news',allowedHosts:[source.newsHost],query:`site:${source.newsHost} (nyhet OR press OR uppdrag OR avtal OR investering OR anläggning OR återvinning OR avfall)`});
  }
  // One official-news query per watched actor; the cap rotates by day when there are more actors than slots.
  const ranked=jobs.map(q=>({q,rank:hash(`${day}|${q.targetId}`)})).sort((a,b)=>a.rank-b.rank||a.q.jobId.localeCompare(b.q.jobId));
  return ranked.slice(0,Math.max(0,Math.floor(maxQueries))).map(x=>x.q);
}

function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

export function summarizeCompetitorSourceLanes(queue:DiscoveryProviderQuery[],actors:string[]|null|undefined){
  const watched=normalizeCompetitorWatchlist(actors,6);
  const byLane=queue.reduce<Record<string,number>>((acc,q)=>{const lane=q.targetId.split(':').at(-1)??'unknown';acc[lane]=(acc[lane]??0)+1;return acc;},{});
  const sourceRows=watched.map(actor=>sourceFor(actor)).filter(Boolean);
  return {enabled:true,watchedActors:watched,queries:queue.length,byLane,verifiedOfficialNews:sourceRows.filter(x=>x?.newsHost).length,verifiedOfficialCareer:sourceRows.filter(x=>x?.careerHost).length,guardrail:'Only explicit verified hosts are allowlisted. Missing direct sources remain gaps; no domain is guessed from a company name.'};
}
