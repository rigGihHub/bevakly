'use client';

type CacheEntry={at:number,payload:unknown,promise?:Promise<unknown>};
const cache=new Map<string,CacheEntry>();
const TTL=5*60*1000;
const SNAPSHOT_TTL=24*60*60*1000;
const SNAPSHOT_PREFIX='bevakly:feed-snapshot:v1:';

export function readFeedSnapshot<T>(url:string):T|null{
 const key=stableUrl(url);
 const hit=cache.get(key);
 if(hit?.payload)return hit.payload as T;
 try{
  const raw=localStorage.getItem(SNAPSHOT_PREFIX+key);
  if(!raw)return null;
  const saved=JSON.parse(raw) as CacheEntry;
  if(typeof saved.at!=='number'||Date.now()-saved.at>SNAPSHOT_TTL||saved.at>Date.now()||!saved.payload){localStorage.removeItem(SNAPSHOT_PREFIX+key);return null;}
  return saved.payload as T;
 }catch{return null;}
}

function saveSnapshot(key:string,payload:unknown){
 try{
  // Retain only the news view, rather than the full intelligence response.
  const p=payload as Record<string,unknown>;
  const compact=Object.fromEntries(['fetchedAt','newsFeedItems','items','discoveryResults','sourceStatus','profileSelection'].filter(k=>k in p).map(k=>[k,p[k]]));
  const keys=Object.keys(localStorage).filter(k=>k.startsWith(SNAPSHOT_PREFIX)&&k!==SNAPSHOT_PREFIX+key);
  if(keys.length>=8){keys.sort((a,b)=>{try{return JSON.parse(localStorage.getItem(a)??'{}').at-JSON.parse(localStorage.getItem(b)??'{}').at}catch{return 0}});for(const old of keys.slice(0,keys.length-7))localStorage.removeItem(old);}
  localStorage.setItem(SNAPSHOT_PREFIX+key,JSON.stringify({at:Date.now(),payload:compact}));
 }catch{}
}

function stableUrl(url:string){
 const u=new URL(url,window.location.origin);
 u.searchParams.delete('refresh');
 const pairs=[...u.searchParams.entries()].sort(([a,av],[b,bv])=>a.localeCompare(b)||av.localeCompare(bv));
 u.search='';
 for(const [k,v] of pairs)u.searchParams.append(k,v);
 return u.pathname+'?'+u.searchParams.toString();
}

export async function fetchFeedShared<T>(url:string,force=false):Promise<T>{
 const key=stableUrl(url),now=Date.now(),hit=cache.get(key);
 if(!force&&hit&&now-hit.at<TTL&&hit.payload)return hit.payload as T;
 if(!force&&hit?.promise)return hit.promise as Promise<T>;
 const promise=fetch(url,{cache:'no-store',signal:AbortSignal.timeout(65000)}).then(async r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json() as Promise<T>}).catch(e=>{if(e?.name==='TimeoutError'||e?.name==='AbortError')throw new Error('Hämtningen tog för lång tid. Försök igen.');throw e;});
 cache.set(key,{at:hit?.at??0,payload:hit?.payload,promise});
 try{const payload=await promise;if(cache.get(key)?.promise===promise){cache.set(key,{at:Date.now(),payload});saveSnapshot(key,payload);}return payload;}
 catch(e){if(cache.get(key)?.promise===promise)cache.delete(key);throw e;}
}

export function clearFeedSharedCache(){cache.clear();}
