export type Candidate = { title: string; url: string; source: string; sourceId: string; sourceType?:string; sourceTier?:number; trustScore?:number };

const stopWords = new Set(["och", "i", "på", "för", "att", "en", "ett", "med", "av", "till", "om", "den", "det", "de", "som"]);

function tokens(title: string) {
  return new Set(
    title.toLocaleLowerCase("sv-SE")
      .replace(/[^a-zåäö0-9 ]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
  );
}

function similarity(a: string, b: string) {
  const at = tokens(a); const bt = tokens(b);
  if (!at.size || !bt.size) return 0;
  let intersection = 0;
  for (const token of at) if (bt.has(token)) intersection += 1;
  return intersection / (at.size + bt.size - intersection);
}

function balanceGroups<T extends Candidate & {duplicates:Candidate[]}>(groups:T[]){
  const buckets=new Map<string,T[]>();
  for(const group of groups){const bucket=buckets.get(group.sourceId)??[];bucket.push(group);buckets.set(group.sourceId,bucket)}
  const orderedBuckets=[...buckets.entries()].sort((a,b)=>{
    const aa=a[1][0],bb=b[1][0];
    const ac=aa?.sourceType==='competitor'?1:0,bc=bb?.sourceType==='competitor'?1:0;
    if(ac!==bc)return bc-ac;
    const at=aa?.sourceTier??9,bt=bb?.sourceTier??9;
    if(at!==bt)return at-bt;
    return (bb?.trustScore??0)-(aa?.trustScore??0);
  });
  const result:T[]=[]; let cursor=0;
  while(result.length<groups.length){
    let progressed=false;
    for(const [,bucket] of orderedBuckets){if(cursor<bucket.length){result.push(bucket[cursor]);progressed=true}}
    if(!progressed)break; cursor++;
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
  // The API applies a hard read cap after this function. Returning groups in source-balanced
  // round-robin order prevents one prolific source early in the crawl from occupying most
  // of that cap. Competitor sources and Tier 1 sources get bucket-order priority, but every
  // represented source still receives a turn before a second item from the same source.
  return balanceGroups(groups);
}
