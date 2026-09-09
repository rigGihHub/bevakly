export type FreshnessDiagnostics={
  considered:number;
  unseen:number;
  seenRecently:number;
  prioritizedUnseen:number;
  retainedSeenForCoverage:number;
  stateEntries:number;
  stateMode:'memory';
  retentionDays:number;
};

type SeenRecord={seenAt:number;sourceId:string};
const seenUrls=new Map<string,SeenRecord>();
const RETENTION_MS=45*24*60*60*1000;
const MAX_ENTRIES=5000;

function canonical(url:string){
  try{
    const u=new URL(url); u.hash='';
    for(const key of [...u.searchParams.keys()]) if(/^utm_|^(fbclid|gclid|mc_cid|mc_eid)$/i.test(key))u.searchParams.delete(key);
    u.pathname=u.pathname.replace(/\/+$/,'')||'/';
    return u.toString();
  }catch{return url.replace(/\/$/,'');}
}

function prune(now:number){
  for(const [key,value] of seenUrls) if(now-value.seenAt>RETENTION_MS)seenUrls.delete(key);
  if(seenUrls.size<=MAX_ENTRIES)return;
  const oldest=[...seenUrls.entries()].sort((a,b)=>a[1].seenAt-b[1].seenAt).slice(0,seenUrls.size-MAX_ENTRIES);
  for(const [key] of oldest)seenUrls.delete(key);
}

export function prioritizeFreshCandidates<T extends {url:string}>(input:{sourceId:string;items:T[];limit:number;now?:Date}){
  const now=(input.now??new Date()).getTime(); prune(now);
  const unseen:T[]=[]; const seen:T[]=[];
  for(const item of input.items){
    const record=seenUrls.get(canonical(item.url));
    if(record&&now-record.seenAt<=RETENTION_MS)seen.push(item); else unseen.push(item);
  }
  const prioritized=[...unseen,...seen].slice(0,input.limit);
  for(const item of prioritized)seenUrls.set(canonical(item.url),{seenAt:now,sourceId:input.sourceId});
  prune(now);
  const retainedSeenForCoverage=Math.max(0,prioritized.length-Math.min(unseen.length,prioritized.length));
  const diagnostics:FreshnessDiagnostics={
    considered:input.items.length,unseen:unseen.length,seenRecently:seen.length,
    prioritizedUnseen:Math.min(unseen.length,prioritized.length),retainedSeenForCoverage,
    stateEntries:seenUrls.size,stateMode:'memory',retentionDays:45,
  };
  return {items:prioritized,diagnostics};
}

export function freshnessStateSummary(){prune(Date.now());return {mode:'memory' as const,entries:seenUrls.size,retentionDays:45,maxEntries:MAX_ENTRIES,persistent:false};}
