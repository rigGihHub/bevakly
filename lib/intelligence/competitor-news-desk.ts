const DEFAULT_COMPETITORS=[
  {name:'PreZero',aliases:['prezero','prezero recycling']},
  {name:'Ragn-Sells',aliases:['ragn-sells','ragn sells','ragnsells']},
  {name:'Stena Recycling',aliases:['stena recycling','stena recycling ab']},
  {name:'REMONDIS',aliases:['remondis','remondis sweden']},
  {name:'Verdis',aliases:['verdis']},
  {name:'Ohlssons',aliases:['ohlssons','ohlssons ab']},
] as const;

function compactActor(value:string){return value.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').replace(/\s+/g,' ').trim()}
function canonicalActor(value:string){
  const key=compactActor(value);
  const match=DEFAULT_COMPETITORS.find(x=>compactActor(x.name)===key||x.aliases.some(alias=>compactActor(alias)===key));
  return match?.name??value.trim();
}
function watchlist(actors:string[],max=6){
  const cleaned=actors.map(x=>x.replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)).filter(Boolean);
  const source=cleaned.length?cleaned:DEFAULT_COMPETITORS.map(x=>x.name);
  const out:string[]=[]; const seen=new Set<string>();
  for(const raw of source){const actor=canonicalActor(raw);const key=compactActor(actor);if(key&&!seen.has(key)){seen.add(key);out.push(actor)}}
  return out.slice(0,max);
}
function canonicalUrl(raw:string){
  try{const u=new URL(raw);u.hash='';for(const key of [...u.searchParams.keys()])if(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','msclkid','mc_cid','mc_eid','ref','source'].includes(key.toLocaleLowerCase('sv-SE')))u.searchParams.delete(key);u.hostname=u.hostname.toLocaleLowerCase('sv-SE').replace(/^www\./,'');u.pathname=u.pathname.replace(/\/{2,}/g,'/').replace(/\/$/,'')||'/';const sorted=[...u.searchParams.entries()].sort(([a],[b])=>a.localeCompare(b));u.search='';for(const [k,v] of sorted)u.searchParams.append(k,v);return u.toString()}catch{return ''}
}


export type CompetitorNewsDeskInput={
  title:string;
  url:string;
  source:string;
  publishedAt:string;
  category:string;
  score:number;
  competitors:string[];
  origin:'fixed'|'discovery';
  sourceType?:string;
  targetId?:string;
};

export type CompetitorNewsHubLane='pressrum'|'media'|'upphandling'|'tillstånd/myndighet'|'jobb'|'företagsförändring'|'övrigt';

export type CompetitorNewsDeskStory=CompetitorNewsDeskInput&{
  actor:string;
  signalType:'upphandling'|'tillstånd'|'anläggning/kapacitet'|'förvärv/ägande'|'rekrytering'|'pris/marknad'|'övrigt';
  hubLane:CompetitorNewsHubLane;
};

export type CompetitorNewsDeskActor={
  actor:string;
  stories:CompetitorNewsDeskStory[];
  latestAt:string|null;
  fixed:number;
  discovery:number;
  signalTypes:string[];
  laneCounts:Record<CompetitorNewsHubLane,number>;
};

function normalizeActor(value:string){
  return compactActor(canonicalActor(value));
}

function classifySignalType(item:CompetitorNewsDeskInput):CompetitorNewsDeskStory['signalType']{
  const text=`${item.title} ${item.category}`.toLocaleLowerCase('sv-SE');
  if(/upphandling|tilldelning|kontrakt|entrepren|ramavtal|anbud/.test(text))return 'upphandling';
  if(/tillstånd|miljöpröv|samråd|domstol|överklag/.test(text))return 'tillstånd';
  if(/anläggning|kapacitet|terminal|omlast|sortering|behandling|byggstart|etablering|investering/.test(text))return 'anläggning/kapacitet';
  if(/förvärv|fusion|köper|försäljning|ägare|ägarförändring|m&a/.test(text))return 'förvärv/ägande';
  if(/rekryter|anställ|jobb|karriär|platschef|regionchef/.test(text))return 'rekrytering';
  if(/pris|taxa|avgift|marknad|index|kostnad/.test(text))return 'pris/marknad';
  return 'övrigt';
}

function safeTime(value:string){
  const t=new Date(value).getTime();
  return Number.isFinite(t)?t:0;
}

function classifyHubLane(item:CompetitorNewsDeskInput):CompetitorNewsHubLane{
  const target=(item.targetId??'').toLocaleLowerCase('sv-SE');
  const sourceType=(item.sourceType??'').toLocaleLowerCase('sv-SE');
  const text=`${item.title} ${item.category}`.toLocaleLowerCase('sv-SE');
  if(target.startsWith('competitor-jobs:')||/jobb|karriär|rekryter|anställ/.test(text))return 'jobb';
  if(target.includes(':procurement')||sourceType==='procurement'||/upphandling|tilldelning|ramavtal|anbud|entreprenad/.test(text))return 'upphandling';
  if(target.includes(':permits')||target.startsWith('public-record:')||sourceType==='authority'||/tillstånd|samråd|länsstyrelsen|domstol|myndighet|överklag/.test(text))return 'tillstånd/myndighet';
  if(target.includes(':corporate')||/förvärv|fusion|köper|säljer|ägare|partnerskap|vd|regionchef|expansion/.test(text))return 'företagsförändring';
  if(sourceType==='competitor'||sourceType==='company')return 'pressrum';
  if(target.includes(':local-media')||sourceType==='media'||item.origin==='discovery')return 'media';
  return 'övrigt';
}

export function buildCompetitorNewsDesk(args:{actors:string[];fixed:CompetitorNewsDeskInput[];discovery:CompetitorNewsDeskInput[];maxPerActor?:number}){
  const maxPerActor=Math.max(1,Math.min(args.maxPerActor??4,10));
  const watched=watchlist(args.actors,6);
  const actorByKey=new Map(watched.map(actor=>[normalizeActor(actor),actor] as const));
  const deduped=new Map<string,CompetitorNewsDeskInput>();

  for(const item of [...args.fixed,...args.discovery]){
    const key=canonicalUrl(item.url)||item.url.trim();
    if(!key)continue;
    const existing=deduped.get(key);
    if(!existing||safeTime(item.publishedAt)>safeTime(existing.publishedAt)||(item.origin==='fixed'&&existing.origin==='discovery')) deduped.set(key,item);
  }

  const groups=new Map<string,CompetitorNewsDeskStory[]>();
  for(const item of deduped.values()){
    const matchedActors=[...new Set(item.competitors.map(normalizeActor).map(key=>actorByKey.get(key)).filter((x):x is string=>Boolean(x)))];
    for(const actor of matchedActors){
      const story:CompetitorNewsDeskStory={...item,actor,signalType:classifySignalType(item),hubLane:classifyHubLane(item)};
      groups.set(actor,[...(groups.get(actor)??[]),story]);
    }
  }

  const actors:CompetitorNewsDeskActor[]=watched.map(actor=>{
    const stories=(groups.get(actor)??[]).sort((a,b)=>safeTime(b.publishedAt)-safeTime(a.publishedAt)||b.score-a.score).slice(0,maxPerActor);
    const laneCounts:Record<CompetitorNewsHubLane,number>={
      pressrum:0,media:0,upphandling:0,'tillstånd/myndighet':0,jobb:0,'företagsförändring':0,övrigt:0,
    };
    for(const story of stories)laneCounts[story.hubLane]++;
    return {
      actor,
      stories,
      latestAt:stories[0]?.publishedAt??null,
      fixed:stories.filter(x=>x.origin==='fixed').length,
      discovery:stories.filter(x=>x.origin==='discovery').length,
      signalTypes:[...new Set(stories.map(x=>x.signalType))],
      laneCounts,
    };
  });

  return {
    actors,
    stories:actors.reduce((n,x)=>n+x.stories.length,0),
    withNews:actors.filter(x=>x.stories.length>0).length,
    principle:'Varje konkurrenthub delar upp verifierade träffar i pressrum, media, upphandling, tillstånd/myndighet, jobb och företagsförändring. En träff är en observation – inte automatiskt en strategisk slutsats.',
  };
}

export type CompetitorNewsSnapshot=Record<string,string[]>;

export function competitorStoryKey(url:string){
  return canonicalUrl(url)||url.trim();
}

export function snapshotCompetitorNewsDesk(desk:{actors:CompetitorNewsDeskActor[]}):CompetitorNewsSnapshot{
  return Object.fromEntries(desk.actors.map(actor=>[actor.actor,actor.stories.map(x=>competitorStoryKey(x.url)).filter(Boolean)]));
}

export function buildCompetitorNewsDelta(desk:{actors:CompetitorNewsDeskActor[]},previous:CompetitorNewsSnapshot|null|undefined){
  const hasBaseline=Boolean(previous&&Object.keys(previous).length);
  const byActor:Record<string,string[]>={};
  let totalNew=0;
  for(const actor of desk.actors){
    const before=new Set(previous?.[actor.actor]??[]);
    const fresh=hasBaseline?actor.stories.map(x=>competitorStoryKey(x.url)).filter(key=>key&&!before.has(key)):[];
    byActor[actor.actor]=fresh;
    totalNew+=fresh.length;
  }
  return {hasBaseline,totalNew,byActor,principle:'NYTT jämför endast verifierade story-URL:er med föregående lyckade uppdatering för samma bevakningsprofil. Första körningen skapar bara en baseline.'};
}
