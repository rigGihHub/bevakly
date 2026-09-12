import type { DiscoveryProviderQuery } from './discovery-provider';
import { normalizeCompetitorWatchlist } from './competitor-news-discovery';

type Lane='procurement'|'permits'|'local-media'|'corporate';
const LANES:Lane[]=['procurement','permits','local-media','corporate'];
function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function slug(v:string){return v.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,'-').replace(/^-|-$/g,'')}
function laneQuery(actor:string,lane:Lane){
  if(lane==='procurement') return `"${actor}" (upphandling OR tilldelning OR anbud OR kontrakt OR ramavtal OR entreprenad OR avtalsstart OR option)`;
  if(lane==='permits') return `"${actor}" (miljötillstånd OR tillstånd OR samråd OR överklagande OR marklov OR detaljplan OR miljödomstol OR länsstyrelsen)`;
  if(lane==='local-media') return `"${actor}" (etablering OR anläggning OR brand OR driftstopp OR protest OR kommun OR investering OR kapacitet OR återvinning OR avfall)`;
  return `"${actor}" (förvärv OR säljer OR köper OR investering OR etablering OR partnerskap OR vd OR regionchef OR expansion OR kapacitet)`;
}
function laneClass(lane:Lane):DiscoveryProviderQuery['sourceClass']{
  if(lane==='permits') return 'environmental-record';
  if(lane==='procurement') return 'authority';
  return 'news';
}
export function buildCompetitorSignalQueue(actors:string[]|null|undefined,now=new Date(),maxQueries=4):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const watched=normalizeCompetitorWatchlist(actors,6);
  const pairs=watched.flatMap(actor=>LANES.map(lane=>({actor,lane,rank:hash(`${day}|${actor}|${lane}`)}))).sort((a,b)=>a.rank-b.rank);
  const chosen:typeof pairs=[]; const actorCount=new Map<string,number>();
  for(const p of pairs){
    if(chosen.length>=Math.max(0,maxQueries)) break;
    if((actorCount.get(p.actor)??0)>=1 && chosen.length<watched.length) continue;
    chosen.push(p); actorCount.set(p.actor,(actorCount.get(p.actor)??0)+1);
  }
  return chosen.map((p,index)=>({
    jobId:`${day}:competitor-signal:${index}:${slug(p.actor)}:${p.lane}`,
    targetId:`competitor-signal:${p.actor}:${p.lane}`,
    targetName:`${p.actor} – ${p.lane}`,
    county:null,
    intent:`competitor-${p.lane}`,
    sourceClass:laneClass(p.lane),
    query:laneQuery(p.actor,p.lane),
  }));
}
export function summarizeCompetitorSignalQueue(queue:DiscoveryProviderQuery[],actors:string[]|null|undefined){
  const lanes=queue.reduce<Record<string,number>>((acc,q)=>{const lane=q.targetId.split(':').at(-1)??'unknown';acc[lane]=(acc[lane]??0)+1;return acc;},{});
  return {enabled:true,watchedActors:normalizeCompetitorWatchlist(actors,6),queries:queue.length,lanes,rotation:'daily deterministic',principle:'Extra competitor signal searches rotate across procurement, permits, local media and corporate change. They only widen discovery; all hits still pass the normal quality and evidence gates.'};
}
