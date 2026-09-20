'use client';

type CacheEntry={at:number,payload:unknown,promise?:Promise<unknown>};
const cache=new Map<string,CacheEntry>();
const TTL=5*60*1000;

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
 const promise=fetch(url,{cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json() as Promise<T>});
 cache.set(key,{at:hit?.at??0,payload:hit?.payload,promise});
 try{const payload=await promise;cache.set(key,{at:Date.now(),payload});return payload;}
 catch(e){cache.delete(key);throw e;}
}

export function clearFeedSharedCache(){cache.clear();}
