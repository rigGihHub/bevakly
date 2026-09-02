export type ClusterableFeedItem = {
  title:string;
  url:string;
  source:string;
  category:string;
  score:number;
  publishedAt:string;
  geographies:string[];
  evidence:string;
  independentSourceCount:number;
  confirmingSources:string[];
};

export type StoryCluster<T extends ClusterableFeedItem = ClusterableFeedItem> = {
  id:string;
  primary:T;
  members:T[];
  storyCount:number;
  sources:string[];
  independentSourceCount:number;
  score:number;
  geographies:string[];
  label:'flerkällestöd'|'återkommande tema';
};

const STOP = new Set([
  'och','att','det','den','de','en','ett','för','med','till','från','som','på','av','om','i','är','har','ska','kan','nya','ny','nytt','efter','vid','mot','över','under','sin','sina','sitt','sig','mer','får','få','nu','så','the','and','for','with','from','this','that','new','into','after','about'
]);

function normalize(value:string){
  return value.toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9åäö]+/g,' ').trim();
}
function tokens(title:string){
  return new Set(normalize(title).split(/\s+/).filter(x=>x.length>=4&&!STOP.has(x)));
}
function intersection(a:Set<string>,b:Set<string>){let n=0;for(const x of a)if(b.has(x))n++;return n;}
function similarity(a:Set<string>,b:Set<string>){const shared=intersection(a,b);const union=new Set([...a,...b]).size;return union?shared/union:0;}
function dayDistance(a:string,b:string){const am=new Date(a).getTime(),bm=new Date(b).getTime();if(Number.isNaN(am)||Number.isNaN(bm))return Infinity;return Math.abs(am-bm)/86400000;}
function geographyOverlap(a:string[],b:string[]){if(!a.length||!b.length)return true;const bs=new Set(b.map(normalize));return a.some(x=>bs.has(normalize(x)));}
function sameStory(a:ClusterableFeedItem,b:ClusterableFeedItem){
  if(a.category!==b.category||dayDistance(a.publishedAt,b.publishedAt)>10||!geographyOverlap(a.geographies,b.geographies)) return false;
  const at=tokens(a.title),bt=tokens(b.title);const shared=intersection(at,bt);
  // Different wording is allowed, but require enough lexical evidence to avoid merging unrelated news.
  return shared>=3 || (shared>=2 && similarity(at,bt)>=0.28);
}
function domain(url:string){try{return new URL(url).hostname.replace(/^www\./,'')}catch{return url}}
function slug(value:string){return normalize(value).replace(/\s+/g,'-').slice(0,70)}

export function buildStoryClusters<T extends ClusterableFeedItem>(items:T[],limit=5):StoryCluster<T>[] {
  const sorted=[...items].sort((a,b)=>b.score-a.score||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime());
  const groups:T[][]=[];
  for(const item of sorted){
    const group=groups.find(g=>g.some(existing=>sameStory(existing,item)));
    if(group) group.push(item); else groups.push([item]);
  }
  return groups.map(group=>{
    const members=[...group].sort((a,b)=>b.score-a.score);
    const primary=members[0];
    const sources=[...new Set(members.flatMap(x=>[x.source,...x.confirmingSources]))];
    const domains=[...new Set(members.flatMap(x=>[domain(x.url),...x.confirmingSources.map(normalize)]))];
    const independentSourceCount=Math.max(...members.map(x=>x.independentSourceCount),domains.length);
    const geographies=[...new Set(members.flatMap(x=>x.geographies))].slice(0,4);
    const score=Math.min(100,primary.score+Math.min(10,(members.length-1)*3)+Math.min(8,(independentSourceCount-1)*2));
    return {id:`story-${slug(primary.title)}`,primary,members,storyCount:members.length,sources,independentSourceCount,score,geographies,label:independentSourceCount>=2?'flerkällestöd':'återkommande tema'} as StoryCluster<T>;
  }).filter(x=>x.storyCount>=2||x.primary.independentSourceCount>=2).sort((a,b)=>b.score-a.score||b.storyCount-a.storyCount).slice(0,limit);
}
