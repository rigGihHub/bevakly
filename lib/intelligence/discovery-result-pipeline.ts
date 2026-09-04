import { assessEarlySignal, type EarlySignalAssessment } from './early-signals';
import { matchCompetitors, matchGeographies } from './entities';
import { assessEvidenceQuality, type EvidenceQuality } from './evidence-quality';

export type DiscoveryProviderResult = {
  jobId:string;
  targetId:string;
  targetName:string;
  query:string;
  title:string;
  url:string;
  publishedAt:string|null;
  snippet:string;
  source?:string|null;
};

export type DiscoveryPipelineContext = {
  industryKeywords:string[];
  knownUrls?:string[];
  maxAgeDays?:number;
};

export type DiscoveryProcessedResult = {
  id:string;
  jobId:string;
  targetId:string;
  targetName:string;
  query:string;
  title:string;
  url:string;
  canonicalUrl:string;
  publishedAt:string;
  source:string;
  snippet:string;
  relevant:boolean;
  relevanceReasons:string[];
  keywordHits:string[];
  geographies:string[];
  competitors:string[];
  earlySignal:EarlySignalAssessment|null;
  evidenceQuality:EvidenceQuality;
  confidence:'låg'|'medel'|'hög';
  score:number;
  status:'accepted'|'rejected';
  rejectionReason:string|null;
};

const TRACKING_PARAMS=new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
  'fbclid','gclid','msclkid','mc_cid','mc_eid','ref','source'
]);

function cleanText(value:string){
  return value.replace(/\s+/g,' ').trim();
}

export function canonicalizeDiscoveryUrl(raw:string){
  try{
    const url=new URL(raw);
    url.hash='';
    for(const key of [...url.searchParams.keys()]){
      if(TRACKING_PARAMS.has(key.toLocaleLowerCase('sv-SE'))) url.searchParams.delete(key);
    }
    url.hostname=url.hostname.toLocaleLowerCase('sv-SE').replace(/^www\./,'');
    if((url.protocol==='https:'&&url.port==='443')||(url.protocol==='http:'&&url.port==='80'))url.port='';
    url.pathname=url.pathname.replace(/\/{2,}/g,'/').replace(/\/$/,'')||'/';
    const sorted=[...url.searchParams.entries()].sort(([a],[b])=>a.localeCompare(b));
    url.search='';
    for(const [k,v] of sorted)url.searchParams.append(k,v);
    return url.toString();
  }catch{
    return '';
  }
}

function domainOf(raw:string){
  try{return new URL(raw).hostname.replace(/^www\./,'').toLocaleLowerCase('sv-SE');}
  catch{return '';}
}

function normalized(value:string){
  return value.toLocaleLowerCase('sv-SE').replace(/\s+/g,' ').trim();
}

function keywordHits(text:string,keywords:string[]){
  const hay=normalized(text);
  return [...new Set(keywords.filter(k=>k.length>2&&hay.includes(normalized(k))))].slice(0,10);
}

function validPublishedAt(value:string|null,maxAgeDays:number){
  if(!value)return {ok:false,iso:null as string|null,reason:'Publiceringsdatum saknas'};
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return {ok:false,iso:null as string|null,reason:'Publiceringsdatum kunde inte tolkas'};
  const age=(Date.now()-date.getTime())/86400000;
  if(age< -1)return {ok:false,iso:date.toISOString(),reason:'Publiceringsdatum ligger i framtiden'};
  if(age>maxAgeDays)return {ok:false,iso:date.toISOString(),reason:`Äldre än ${maxAgeDays} dagar`};
  return {ok:true,iso:date.toISOString(),reason:null};
}

function confidenceFor(input:{score:number;earlySignal:EarlySignalAssessment|null;evidence:EvidenceQuality}):'låg'|'medel'|'hög'{
  if(input.evidence.quality==='Starkt'&&input.score>=80)return 'hög';
  if(input.evidence.quality==='Medel'||input.earlySignal?.strength==='stark'||input.score>=72)return 'medel';
  return 'låg';
}

function stableId(value:string){
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `discovery-${(hash>>>0).toString(16)}`;
}

export function processDiscoveryResult(
  raw:DiscoveryProviderResult,
  context:DiscoveryPipelineContext,
):DiscoveryProcessedResult{
  const maxAgeDays=Math.max(1,Math.min(180,context.maxAgeDays??30));
  const canonicalUrl=canonicalizeDiscoveryUrl(raw.url);
  const title=cleanText(raw.title);
  const snippet=cleanText(raw.snippet);
  const text=`${title} ${snippet} ${raw.targetName} ${raw.query}`;
  const hits=keywordHits(text,context.industryKeywords);
  const earlySignal=assessEarlySignal({title,body:snippet,url:canonicalUrl||raw.url,source:raw.source??undefined});
  const geographies=matchGeographies(text);
  const competitors=matchCompetitors(text).map(x=>x.name);
  const date=validPublishedAt(raw.publishedAt,maxAgeDays);
  const known=new Set((context.knownUrls??[]).map(canonicalizeDiscoveryUrl).filter(Boolean));
  const relevanceReasons:string[]=[];
  if(hits.length)relevanceReasons.push(`Matchar ${hits.length} branschbegrepp`);
  if(earlySignal)relevanceReasons.push(`${earlySignal.type} identifierad`);
  if(geographies.length)relevanceReasons.push(`Geografi: ${geographies.slice(0,2).join(', ')}`);
  if(competitors.length)relevanceReasons.push(`Konkurrent: ${competitors.slice(0,2).join(', ')}`);

  let rejectionReason:string|null=null;
  if(!canonicalUrl)rejectionReason='Ogiltig URL';
  else if(title.length<8)rejectionReason='Rubriken är för kort för säker klassificering';
  else if(!date.ok)rejectionReason=date.reason;
  else if(known.has(canonicalUrl))rejectionReason='Finns redan i det kända flödet';
  else if(hits.length===0&&!earlySignal)rejectionReason='Saknar både branschmatchning och tidig signal';

  const relevant=!rejectionReason;
  const source=raw.source?.trim()||domainOf(canonicalUrl)||'Okänd discovery-källa';
  const sourceType=/(lansstyrelsen|kommun|naturvardsverket|regeringen|riksdagen)/i.test(`${source} ${canonicalUrl}`)?'authority':'media';
  const sourceTier=sourceType==='authority'?1:3;
  const trustScore=sourceType==='authority'?95:60;
  const evidenceQuality=assessEvidenceQuality([{
    title,url:canonicalUrl||raw.url,source,sourceId:`discovery:${domainOf(canonicalUrl||raw.url)}`,
    sourceType,sourceTier,trustScore
  }]);

  let score=40;
  score+=Math.min(24,hits.length*4);
  score+=earlySignal?.scoreBonus??0;
  score+=Math.min(8,geographies.length*4);
  score+=Math.min(10,competitors.length*5);
  if(sourceType==='authority')score+=10;
  score=Math.min(100,score);

  return {
    id:stableId(`${raw.jobId}|${canonicalUrl||raw.url}`),
    jobId:raw.jobId,targetId:raw.targetId,targetName:raw.targetName,query:raw.query,
    title,url:raw.url,canonicalUrl,publishedAt:date.iso??'',source,snippet,
    relevant,relevanceReasons,keywordHits:hits,geographies,competitors,earlySignal,
    evidenceQuality,confidence:confidenceFor({score,earlySignal,evidence:evidenceQuality}),
    score,status:relevant?'accepted':'rejected',rejectionReason
  };
}

export function dedupeDiscoveryResults(results:DiscoveryProcessedResult[]){
  const accepted=results.filter(x=>x.status==='accepted');
  const byUrl=new Map<string,DiscoveryProcessedResult>();
  for(const result of accepted){
    const existing=byUrl.get(result.canonicalUrl);
    if(!existing||result.score>existing.score)byUrl.set(result.canonicalUrl,result);
  }

  // Conservative near-duplicate pass: same normalized title + same calendar date => one event.
  const byEvent=new Map<string,DiscoveryProcessedResult>();
  for(const result of byUrl.values()){
    const titleKey=normalized(result.title).replace(/[^a-zåäö0-9 ]/g,' ').replace(/\s+/g,' ');
    const dateKey=result.publishedAt.slice(0,10);
    const key=`${titleKey}|${dateKey}`;
    const existing=byEvent.get(key);
    if(!existing||result.score>existing.score)byEvent.set(key,result);
  }
  return [...byEvent.values()].sort((a,b)=>b.score-a.score||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime());
}

export function buildDiscoveryEvidence(results:DiscoveryProcessedResult[]){
  const grouped=new Map<string,DiscoveryProcessedResult[]>();
  for(const result of results.filter(x=>x.status==='accepted')){
    const key=normalized(result.title).replace(/[^a-zåäö0-9 ]/g,' ').replace(/\s+/g,' ');
    const list=grouped.get(key)??[];
    list.push(result); grouped.set(key,list);
  }
  return [...grouped.entries()].map(([key,members])=>({
    key,
    members,
    evidenceQuality:assessEvidenceQuality(members.map(x=>({
      title:x.title,url:x.canonicalUrl,source:x.source,sourceId:`discovery:${domainOf(x.canonicalUrl)}`,
      sourceType:/(lansstyrelsen|kommun|naturvardsverket|regeringen|riksdagen)/i.test(`${x.source} ${x.canonicalUrl}`)?'authority':'media',
      sourceTier:/(lansstyrelsen|kommun|naturvardsverket|regeringen|riksdagen)/i.test(`${x.source} ${x.canonicalUrl}`)?1:3,
      trustScore:/(lansstyrelsen|kommun|naturvardsverket|regeringen|riksdagen)/i.test(`${x.source} ${x.canonicalUrl}`)?95:60
    })))
  }));
}
