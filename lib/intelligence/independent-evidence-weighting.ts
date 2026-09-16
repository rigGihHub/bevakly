import { assessEvidenceQuality, type EvidenceMember } from './evidence-quality';
import { OFFICIAL_COMPETITOR_SOURCES } from './competitor-official-sources';

export type EvidenceSourceRole='self-reported'|'official'|'independent'|'direct'|'unknown';
export type EvidenceStatus='self-reported'|'independently-reported'|'officially-confirmed'|'multi-source-confirmed'|'single-source';

export type NewsEvidenceSource=EvidenceMember;

export type EvidenceWeightedNewsInput={
  title:string;
  url:string;
  source:string;
  sourceType:string;
  sourceTier?:number;
  trustScore?:number;
  publishedAt:string;
  category:string;
  score:number;
  importance:string;
  factualSummary:string;
  geographies:string[];
  competitors:string[];
  sourceCount?:number;
  independentSourceCount?:number;
  confirmingSources?:string[];
  evidence?:string;
  bidNewsRelevance?:unknown;
  targetId?:string;
  supportingSources?:NewsEvidenceSource[];
};

export type WeightedEvidenceSource={source:string;url:string;role:EvidenceSourceRole};

export type EvidenceWeightedNewsItem=EvidenceWeightedNewsInput&{
  evidenceStatus:EvidenceStatus;
  evidenceLabel:string;
  evidenceScoreAdjustment:number;
  relatedSources:WeightedEvidenceSource[];
};

const STOP=new Set(['och','att','det','den','de','en','ett','för','med','till','från','som','på','av','om','efter','vid','mot','över','under','nya','ny','nytt','har','ska','kan','samt','the','and','for','with','from','this','that','new']);
const officialCompetitorHosts=[...new Set(OFFICIAL_COMPETITOR_SOURCES.flatMap(x=>[x.newsHost,x.careerHost]).filter((x):x is string=>Boolean(x)).map(normalizeHost))];

function normalize(value:string){return value.toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9åäö]+/g,' ').trim();}
function normalizeHost(value:string){return value.toLocaleLowerCase('sv-SE').replace(/^www\./,'');}
function host(url:string){try{return normalizeHost(new URL(url).hostname);}catch{return '';}}
function hostMatches(candidate:string,rule:string){return candidate===rule||candidate.endsWith(`.${rule}`);}
function tokens(value:string){return new Set(normalize(value).split(/\s+/).filter(x=>x.length>=4&&!STOP.has(x)));}
function intersection<T>(a:Set<T>,b:Set<T>){let count=0;for(const value of a)if(b.has(value))count++;return count;}
function similarity(a:Set<string>,b:Set<string>){const shared=intersection(a,b);const union=new Set([...a,...b]).size;return union?shared/union:0;}
function daysApart(a:string,b:string){const aa=new Date(a).getTime(),bb=new Date(b).getTime();if(Number.isNaN(aa)||Number.isNaN(bb))return Infinity;return Math.abs(aa-bb)/86400000;}
function overlap(a:string[],b:string[]){const bb=new Set(b.map(normalize));return a.some(x=>bb.has(normalize(x)));}

export function evidenceSourceRole(source:Pick<NewsEvidenceSource,'url'|'sourceType'>):EvidenceSourceRole{
  const sourceHost=host(source.url);
  if(source.sourceType==='competitor'||officialCompetitorHosts.some(rule=>hostMatches(sourceHost,rule)))return 'self-reported';
  if(['authority','procurement','eu'].includes(source.sourceType))return 'official';
  if(['media','news','industry','research'].includes(source.sourceType))return 'independent';
  if(source.sourceType==='company')return 'direct';
  return 'unknown';
}

function sameEvent(a:EvidenceWeightedNewsInput,b:EvidenceWeightedNewsInput){
  if(daysApart(a.publishedAt,b.publishedAt)>10)return false;
  const at=tokens(a.title),bt=tokens(b.title);const shared=intersection(at,bt);const lexical=similarity(at,bt);
  const sameCompetitor=overlap(a.competitors,b.competitors);
  const sameGeography=overlap(a.geographies,b.geographies);
  if(sameCompetitor)return shared>=3||(sameGeography&&shared>=2)||lexical>=0.45;
  return (sameGeography&&shared>=3&&lexical>=0.30)||shared>=4||lexical>=0.58;
}

function sourceMembers(item:EvidenceWeightedNewsInput):NewsEvidenceSource[]{
  if(item.supportingSources?.length)return item.supportingSources;
  return [{
    title:item.title,url:item.url,source:item.source,sourceId:`feed:${host(item.url)||normalize(item.source)}`,
    sourceType:item.sourceType,sourceTier:item.sourceTier??3,trustScore:item.trustScore??60,
  }];
}

function uniqueSources(items:EvidenceWeightedNewsInput[]){
  const byUrl=new Map<string,NewsEvidenceSource>();
  for(const source of items.flatMap(sourceMembers)){
    const key=source.url.replace(/\/$/,'');
    const existing=byUrl.get(key);
    if(!existing||source.trustScore>existing.trustScore)byUrl.set(key,source);
  }
  return [...byUrl.values()];
}

function primaryRank(item:EvidenceWeightedNewsInput){
  const roles=sourceMembers(item).map(evidenceSourceRole);
  if(roles.includes('official'))return 5;
  if(roles.includes('independent'))return 4;
  if(roles.includes('direct'))return 3;
  if(roles.includes('self-reported'))return 2;
  return 1;
}

function evidenceStatus(sources:NewsEvidenceSource[]){
  const quality=assessEvidenceQuality(sources);
  const roles=sources.map(evidenceSourceRole);
  const hasSelf=roles.includes('self-reported');
  const hasOfficial=roles.includes('official');
  const hasIndependent=roles.includes('independent');
  const hasExternal=hasOfficial||hasIndependent;

  let status:EvidenceStatus='single-source';
  if(quality.independentOrigins>=2&&hasExternal)status='multi-source-confirmed';
  else if(hasOfficial)status='officially-confirmed';
  else if(hasIndependent)status='independently-reported';
  else if(hasSelf)status='self-reported';

  const label=
    status==='multi-source-confirmed'?`Bekräftad av ${quality.independentOrigins} separata källor`:
    status==='officially-confirmed'?'Officiellt bekräftad':
    status==='independently-reported'?'Oberoende rapporterad':
    status==='self-reported'?'Uppgift från bolaget':'Enskild källa';
  const adjustment=status==='multi-source-confirmed'?8:status==='officially-confirmed'?5:status==='independently-reported'?3:0;
  return {status,label,adjustment,quality};
}

export function buildEvidenceWeightedNewsFeed(items:EvidenceWeightedNewsInput[],limit=120):EvidenceWeightedNewsItem[]{
  const valid=items.filter(item=>item.url&&item.title&&item.publishedAt&&!Number.isNaN(new Date(item.publishedAt).getTime()));
  const groups:EvidenceWeightedNewsInput[][]=[];
  for(const item of [...valid].sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime())){
    const group=groups.find(existing=>existing.some(other=>sameEvent(item,other)));
    if(group)group.push(item);else groups.push([item]);
  }

  return groups.map(group=>{
    const sources=uniqueSources(group);
    const assessment=evidenceStatus(sources);
    const primary=[...group].sort((a,b)=>primaryRank(b)-primaryRank(a)||b.score-a.score||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime())[0];
    const relatedSources=sources.map(source=>({source:source.source,url:source.url,role:evidenceSourceRole(source)}));
    const existingOrigins=Math.max(...group.map(x=>x.independentSourceCount??0),0);
    const independentSourceCount=Math.max(existingOrigins,assessment.quality.independentOrigins);
    return {
      ...primary,
      score:Math.min(100,primary.score+assessment.adjustment),
      sourceCount:sources.length,
      independentSourceCount,
      confirmingSources:[...new Set(sources.map(x=>x.source))],
      evidence:assessment.label,
      evidenceStatus:assessment.status,
      evidenceLabel:assessment.label,
      evidenceScoreAdjustment:assessment.adjustment,
      relatedSources,
      supportingSources:sources,
    };
  }).sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()||b.score-a.score).slice(0,limit);
}
