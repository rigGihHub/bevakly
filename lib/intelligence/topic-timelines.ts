export type TimelineItem = {
  title:string;
  factualSummary:string;
  publishedAt:string;
  category:string;
  geographies?:string[];
  source?:string;
  url:string;
  score?:number;
};

export type TopicTimeline = {
  id:string;
  label:string;
  category:string;
  geographies:string[];
  itemCount:number;
  sourceCount:number;
  firstSeen:string;
  lastSeen:string;
  direction:'accelererar'|'stabil'|'avtar';
  items:TimelineItem[];
};

const STOP=new Set(['och','eller','att','det','den','som','för','med','till','från','har','om','på','av','ett','en','är','nya','ny','samt','ska','kan','mot','efter','under','över','vid','the','and','for','with','from']);
function tokens(text:string){return text.toLowerCase().replace(/[^a-zåäö0-9]+/gi,' ').split(/\s+/).filter(w=>w.length>4&&!STOP.has(w));}
function similarity(a:TimelineItem,b:TimelineItem){
  if(a.category!==b.category)return 0;
  const A=new Set(tokens(`${a.title} ${a.factualSummary}`)),B=new Set(tokens(`${b.title} ${b.factualSummary}`));
  if(!A.size||!B.size)return 0;
  let shared=0; for(const w of A)if(B.has(w))shared++;
  let score=shared/Math.min(A.size,B.size);
  const ga=new Set(a.geographies??[]); if((b.geographies??[]).some(g=>ga.has(g)))score+=.12;
  return Math.min(1,score);
}
function topicLabel(items:TimelineItem[]){
  const freq=new Map<string,number>();
  for(const item of items)for(const t of new Set(tokens(item.title)))freq.set(t,(freq.get(t)??0)+1);
  const words=[...freq.entries()].sort((a,b)=>b[1]-a[1]||b[0].length-a[0].length).filter(([,n])=>n>=2).slice(0,3).map(([w])=>w);
  return words.length?words.map(w=>w[0].toUpperCase()+w.slice(1)).join(' · '):items[items.length-1].title;
}
function direction(items:TimelineItem[]){
  if(items.length<3)return 'stabil' as const;
  const last=new Date(items[items.length-1].publishedAt).getTime();
  const recent=items.filter(x=>last-new Date(x.publishedAt).getTime()<=7*86400000).length;
  const previous=items.filter(x=>{const d=last-new Date(x.publishedAt).getTime();return d>7*86400000&&d<=21*86400000}).length;
  if(recent>=2&&recent>previous)return 'accelererar' as const;
  if(recent===0&&previous>=2)return 'avtar' as const;
  return 'stabil' as const;
}

export function buildTopicTimelines(input:TimelineItem[],limit=5):TopicTimeline[]{
  const items=[...input].filter(x=>x.publishedAt&&!Number.isNaN(new Date(x.publishedAt).getTime())).sort((a,b)=>new Date(a.publishedAt).getTime()-new Date(b.publishedAt).getTime());
  const groups:TimelineItem[][]=[];
  for(const item of items){
    let best=-1,bestScore=0;
    groups.forEach((g,i)=>{const score=Math.max(...g.slice(-4).map(x=>similarity(item,x)));if(score>bestScore){bestScore=score;best=i;}});
    if(best>=0&&bestScore>=.38)groups[best].push(item);else groups.push([item]);
  }
  return groups.filter(g=>g.length>=3).map((g,i)=>{
    const sources=new Set(g.map(x=>x.source).filter(Boolean));
    const geos=[...new Set(g.flatMap(x=>x.geographies??[]))];
    return {id:`timeline-${i}-${g[g.length-1].url}`,label:topicLabel(g),category:g[g.length-1].category,geographies:geos,itemCount:g.length,sourceCount:sources.size,firstSeen:g[0].publishedAt,lastSeen:g[g.length-1].publishedAt,direction:direction(g),items:g.slice(-5)};
  }).sort((a,b)=>new Date(b.lastSeen).getTime()-new Date(a.lastSeen).getTime()||b.itemCount-a.itemCount).slice(0,limit);
}
