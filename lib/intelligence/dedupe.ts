export type Candidate = { title: string; url: string; source: string; sourceId: string; sourceType?:string; sourceTier?:number; trustScore?:number };

const stopWords = new Set(["och", "i", "på", "för", "att", "en", "ett", "med", "av", "till", "om", "den", "det", "de", "som"]);

function tokens(title: string) {
  return new Set(
    title.toLocaleLowerCase("sv-SE")
      .replace(/[^a-zåäö0-9 ]/gi, " ")
      .split(/\s+/)
      .filter((word) => (word.length > 2 || /^\d+$/.test(word)) && !stopWords.has(word))
  );
}

function similarity(a: string, b: string) {
  const at = tokens(a); const bt = tokens(b);
  if (!at.size || !bt.size) return 0;
  const an=[...at].filter(token=>/^\d+$/.test(token));
  const bn=[...bt].filter(token=>/^\d+$/.test(token));
  if(an.length&&bn.length&&!an.some(token=>bn.includes(token)))return 0;
  let intersection = 0;
  for (const token of at) if (bt.has(token)) intersection += 1;
  return intersection / (at.size + bt.size - intersection);
}

const typePriority=['competitor','industry','media','procurement','authority','research','eu','company'];
function typeRank(value?:string){const i=typePriority.indexOf(value??'');return i===-1?typePriority.length:i;}
function candidateRank(a:Candidate,b:Candidate){
  const ar=typeRank(a.sourceType),br=typeRank(b.sourceType);
  if(ar!==br)return ar-br;
  const at=a.sourceTier??9,bt=b.sourceTier??9;
  if(at!==bt)return at-bt;
  return (b.trustScore??0)-(a.trustScore??0);
}

function bestRepresentative<T extends Candidate & {duplicates:Candidate[]}>(group:T){
  const best=[group,...group.duplicates].sort(candidateRank)[0];
  if(best===group)return group;
  const duplicates=[group,...group.duplicates.filter(x=>x.url!==best.url)];
  return {...group,...best,duplicates} as T;
}

function balanceGroups<T extends Candidate & {duplicates:Candidate[]}>(input:T[]){
  const groups=input.map(bestRepresentative);
  const byType=new Map<string,Map<string,T[]>>();
  for(const group of groups){
    const type=group.sourceType??'other';
    const sources=byType.get(type)??new Map<string,T[]>();
    const bucket=sources.get(group.sourceId)??[];
    bucket.push(group);
    sources.set(group.sourceId,bucket);
    byType.set(type,sources);
  }
  const orderedTypes=[...byType.keys()].sort((a,b)=>typeRank(a)-typeRank(b));
  const sourceOrders=new Map<string,Array<{sourceId:string;bucket:T[];index:number}>>();
  for(const type of orderedTypes){
    const sources=byType.get(type)!;
    sourceOrders.set(type,[...sources.entries()].sort((a,b)=>candidateRank(a[1][0],b[1][0])).map(([sourceId,bucket])=>({sourceId,bucket,index:0})));
  }
  const result:T[]=[];
  const sourceCursor=new Map(orderedTypes.map(type=>[type,0]));
  while(result.length<groups.length){
    let progressed=false;
    for(const type of orderedTypes){
      const sources=sourceOrders.get(type)!;
      if(!sources.length)continue;
      const start=sourceCursor.get(type)??0;
      for(let offset=0;offset<sources.length;offset++){
        const position=(start+offset)%sources.length;
        const source=sources[position];
        const item=source.bucket[source.index];
        if(!item)continue;
        result.push(item);source.index++;sourceCursor.set(type,(position+1)%sources.length);progressed=true;break;
      }
    }
    if(!progressed)break;
  }
  return result;
}

export function dedupeCandidates(items: Candidate[]) {
  const groups: Array<Candidate & { duplicates: Candidate[] }> = [];
  for (const item of items) {
    const existing = groups.find((group) => similarity(group.title, item.title) >= 0.62);
    if (existing) existing.duplicates.push(item);
    else groups.push({ ...item, duplicates: [] });
  }
  // The API applies a hard read cap after this function. We therefore balance before that cap
  // both by source type and by source. Competitor/industry/media lanes get early representation,
  // but authority/research/EU lanes still receive a turn before any one source type can flood intake.
  // If a duplicate cluster contains a stronger source than the first-seen candidate, that stronger
  // source becomes the representative for ordering; all duplicate evidence is preserved.
  return balanceGroups(groups);
}
