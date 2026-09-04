export type DiscoveryProviderQuery={
  jobId:string;
  targetId:string;
  targetName:string;
  county:string|null;
  intent:string;
  query:string;
};

export type DiscoveryProviderHit={
  title:string;
  url:string;
  publishedAt:string|null;
  snippet:string;
  source?:string|null;
};

export type DiscoveryProviderResponse={
  provider:string;
  query:DiscoveryProviderQuery;
  hits:DiscoveryProviderHit[];
  fromCache:boolean;
  attempts:number;
  estimatedCost:number;
  error:string|null;
};

export type DiscoveryProvider={
  id:string;
  search(query:DiscoveryProviderQuery, signal?:AbortSignal):Promise<DiscoveryProviderHit[]>;
};

export type ProviderPolicy={
  maxQueriesPerRun:number;
  maxResultsPerQuery:number;
  maxEstimatedCostPerRun:number;
  cacheTtlMs:number;
  retryCount:number;
  baseBackoffMs:number;
};

type CacheEntry={expiresAt:number;hits:DiscoveryProviderHit[]};
const memoryCache=new Map<string,CacheEntry>();

function stableKey(provider:string,q:DiscoveryProviderQuery){
  return `${provider}|${q.targetId}|${q.intent}|${q.query}`.toLocaleLowerCase('sv-SE');
}
function sleep(ms:number){return new Promise(resolve=>setTimeout(resolve,ms));}
function cleanHits(hits:DiscoveryProviderHit[],limit:number){
  const seen=new Set<string>();
  const out:DiscoveryProviderHit[]=[];
  for(const hit of hits){
    if(!hit?.url||!hit?.title)continue;
    const key=hit.url.trim();
    if(seen.has(key))continue;
    seen.add(key);
    out.push({title:hit.title.trim(),url:key,publishedAt:hit.publishedAt??null,snippet:(hit.snippet??'').trim(),source:hit.source??null});
    if(out.length>=limit)break;
  }
  return out;
}

export const defaultProviderPolicy:ProviderPolicy={
  maxQueriesPerRun:6,
  maxResultsPerQuery:8,
  maxEstimatedCostPerRun:0.20,
  cacheTtlMs:6*60*60*1000,
  retryCount:2,
  baseBackoffMs:350,
};

export async function runDiscoveryProvider(
  provider:DiscoveryProvider,
  queries:DiscoveryProviderQuery[],
  policy:ProviderPolicy=defaultProviderPolicy,
  estimatedCostPerQuery=0.01,
):Promise<{responses:DiscoveryProviderResponse[];usedQueries:number;estimatedCost:number;stoppedReason:string|null}>{
  const responses:DiscoveryProviderResponse[]=[];
  let usedQueries=0,estimatedCost=0,stoppedReason:string|null=null;
  for(const query of queries){
    if(usedQueries>=policy.maxQueriesPerRun){stoppedReason='query-limit';break;}
    if(estimatedCost+estimatedCostPerQuery>policy.maxEstimatedCostPerRun){stoppedReason='cost-limit';break;}
    const key=stableKey(provider.id,query);
    const cached=memoryCache.get(key);
    if(cached&&cached.expiresAt>Date.now()){
      responses.push({provider:provider.id,query,hits:cached.hits,fromCache:true,attempts:0,estimatedCost:0,error:null});
      continue;
    }

    let hits:DiscoveryProviderHit[]=[];let error:string|null=null;let attempts=0;
    for(let attempt=0;attempt<=policy.retryCount;attempt++){
      attempts++;
      try{
        hits=cleanHits(await provider.search(query),policy.maxResultsPerQuery);
        error=null; break;
      }catch(e){
        error=e instanceof Error?e.message:'Provider error';
        if(attempt<policy.retryCount) await sleep(policy.baseBackoffMs*Math.pow(2,attempt));
      }
    }
    usedQueries++; estimatedCost+=estimatedCostPerQuery;
    if(!error) memoryCache.set(key,{expiresAt:Date.now()+policy.cacheTtlMs,hits});
    responses.push({provider:provider.id,query,hits,fromCache:false,attempts,estimatedCost:estimatedCostPerQuery,error});
  }
  return {responses,usedQueries,estimatedCost:Number(estimatedCost.toFixed(4)),stoppedReason};
}

export function providerRuntimeSummary(policy:ProviderPolicy=defaultProviderPolicy){
  return {
    providerConnected:false,
    cache:'memory',
    cacheTtlHours:Math.round(policy.cacheTtlMs/3600000),
    maxQueriesPerRun:policy.maxQueriesPerRun,
    maxResultsPerQuery:policy.maxResultsPerQuery,
    retryCount:policy.retryCount,
    backoff:'exponential',
    maxEstimatedCostPerRun:policy.maxEstimatedCostPerRun,
  };
}
