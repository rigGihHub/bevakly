import type { DiscoveryProviderQuery } from './discovery-provider';
import { normalizeCompetitorWatchlist } from './competitor-news-discovery';

export type VerifiedCompetitorCareerSource={competitor:string;id:string;hosts:string[];careerUrl:string;signalRoles:string[]};

// Career hosts are explicit and verified; never infer a careers domain from a company name.
export const verifiedCompetitorCareerSources:VerifiedCompetitorCareerSource[]=[
  {competitor:'PreZero',id:'prezero',hosts:['jobs.prezero.se'],careerUrl:'https://jobs.prezero.se/lediga-tjaenster-paa-prezero',signalRoles:['driftledare','platschef','säljare','projektledare','miljöarbetare','chaufför']},
  {competitor:'Ragn-Sells',id:'ragn-sells',hosts:['ragnsells.se'],careerUrl:'https://www.ragnsells.se/om-oss/karriar/lediga-tjanster/',signalRoles:['platschef','anläggning','säljare','projektledare','produktion','farligt avfall']},
  {competitor:'Stena Recycling',id:'stena-recycling',hosts:['stenarecycling.com'],careerUrl:'https://www.stenarecycling.com/sv/karriar/lediga-tjanster/',signalRoles:['branch manager','production manager','account manager','processingenjör','teknisk chef','produktion']},
  {competitor:'REMONDIS',id:'remondis',hosts:['jobb.remondis.se'],careerUrl:'https://jobb.remondis.se/jobs',signalRoles:['transportledare','account manager','platschef','chaufför','produktion','jurist']},
  {competitor:'Verdis',id:'verdis',hosts:['verdis.se'],careerUrl:'https://www.verdis.se/bli-en-av-oss/lediga-jobb/',signalRoles:['produktionschef','arbetsledare','chaufför','miljöarbetare','transport']},
];

function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

export function buildCompetitorJobQueue(actors:string[]|null|undefined,now=new Date(),maxQueries=3):DiscoveryProviderQuery[]{
  const day=now.toISOString().slice(0,10);
  const watched=new Set(normalizeCompetitorWatchlist(actors,6).map(x=>x.toLocaleLowerCase('sv-SE')));
  const ordered=verifiedCompetitorCareerSources.filter(x=>watched.has(x.competitor.toLocaleLowerCase('sv-SE'))).sort((a,b)=>(hash(`${day}|${a.id}`)-hash(`${day}|${b.id}`))||a.id.localeCompare(b.id));
  return ordered.slice(0,Math.max(0,Math.min(ordered.length,Math.floor(maxQueries)))).map(source=>({
    jobId:`${day}:competitor-jobs:${source.id}`,
    targetId:`competitor-jobs:${source.id}`,
    targetName:`${source.competitor} – jobbannonser`,
    county:null,
    intent:'competitor-jobs',
    query:`site:${source.hosts[0]} (jobb OR \"lediga tjänster\" OR karriär) (${source.signalRoles.slice(0,5).join(' OR ')})`,
    allowedHosts:source.hosts,
    sourceClass:'competitor-jobs',
  }));
}

export function summarizeCompetitorJobDiscovery(queue:DiscoveryProviderQuery[],actors:string[]|null|undefined){const watched=normalizeCompetitorWatchlist(actors,6); const watchedSet=new Set(watched.map(x=>x.toLocaleLowerCase('sv-SE'))); const sources=verifiedCompetitorCareerSources.filter(x=>watchedSet.has(x.competitor.toLocaleLowerCase('sv-SE'))); return {enabled:true,watchedActors:watched,verificationMode:'official-career-host-allowlist',verifiedCompetitors:sources.length,careerSources:sources.map(x=>({competitor:x.competitor,careerUrl:x.careerUrl,hosts:x.hosts})),queuedQueries:queue.length,automaticDomainGuessing:false,interpretation:'Job ads are weak signals alone; clusters by role, geography and time become stronger when corroborated by other source classes.'};}

export function classifyJobSignal(text:string){
  const t=text.toLocaleLowerCase('sv-SE');
  const strategic=/(branch manager|produktionschef|production manager|platschef|teknisk chef|processingenjör|projektledare|affärsutveckl|account manager|sälj)/i.test(t);
  const scale=/(flera|växer|bygga upp|kommande uppdrag|nytt uppdrag|expander|ny anläggning|etabler)/i.test(t);
  const operational=/(chaufför|miljöarbetare|produktionsarbetare|transportledare|arbetsledare)/i.test(t);
  return {strategic,scale,operational,signalStrength:strategic&&scale?'high':strategic||scale?'medium':operational?'low':'unknown'} as const;
}
