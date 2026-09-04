import type { DiscoveryProvider, DiscoveryProviderHit, DiscoveryProviderQuery, ProviderPolicy } from './discovery-provider';
import { defaultProviderPolicy } from './discovery-provider';
import { providerHealth, recordProviderFailure, recordProviderSuccess } from './discovery-provider-health';
import { dedupeDiscoveryResults, processDiscoveryResult, type DiscoveryProcessedResult } from './discovery-result-pipeline';

export type DiscoveryOrchestratorRun={
  status:'waiting-for-provider'|'completed'|'budget-stopped';
  configuredProviders:string[];
  queuedJobs:number;
  executedQueries:number;
  providerRequests:number;
  cacheHits:number;
  estimatedCost:number;
  accepted:number;
  rejected:number;
  stoppedReason:string|null;
  attempts:Array<{jobId:string;providerId:string;ok:boolean;fromCache:boolean;hitCount:number;latencyMs:number;error:string|null}>;
  results:DiscoveryProcessedResult[];
};

type CacheEntry={expiresAt:number;providerId:string;hits:DiscoveryProviderHit[]};
const cache=new Map<string,CacheEntry>();

function key(q:DiscoveryProviderQuery){return `${q.targetId}|${q.intent}|${q.query}`.toLocaleLowerCase('sv-SE');}
function priority(status:string){return status==='healthy'?0:status==='unknown'?1:status==='degraded'?2:3;}
function cleanHits(hits:DiscoveryProviderHit[],limit:number){
  const out:DiscoveryProviderHit[]=[]; const seen=new Set<string>();
  for(const hit of hits){
    if(!hit?.title?.trim()||!hit?.url?.trim())continue;
    const url=hit.url.trim(); if(seen.has(url))continue; seen.add(url);
    out.push({title:hit.title.trim(),url,publishedAt:hit.publishedAt??null,snippet:(hit.snippet??'').trim(),source:hit.source??null});
    if(out.length>=limit)break;
  }
  return out;
}

export async function runDiscoveryOrchestrator(input:{
  providers:DiscoveryProvider[];
  queue:DiscoveryProviderQuery[];
  industryKeywords:string[];
  knownUrls?:string[];
  maxAgeDays?:number;
  policy?:ProviderPolicy;
  estimatedCostPerProviderRequest?:number;
}):Promise<DiscoveryOrchestratorRun>{
  const policy=input.policy??defaultProviderPolicy;
  const requestCost=Math.max(0,input.estimatedCostPerProviderRequest??0.01);
  const base={configuredProviders:input.providers.map(x=>x.id),queuedJobs:input.queue.length,executedQueries:0,providerRequests:0,cacheHits:0,estimatedCost:0,accepted:0,rejected:0,stoppedReason:null as string|null,attempts:[] as DiscoveryOrchestratorRun['attempts'],results:[] as DiscoveryProcessedResult[]};
  if(input.providers.length===0)return {...base,status:'waiting-for-provider'};

  const processed:DiscoveryProcessedResult[]=[];
  for(const query of input.queue){
    if(base.executedQueries>=policy.maxQueriesPerRun){base.stoppedReason='query-limit';break;}
    const cached=cache.get(key(query));
    let hits:DiscoveryProviderHit[]=[];
    if(cached&&cached.expiresAt>Date.now()){
      hits=cached.hits; base.cacheHits++; base.executedQueries++;
      base.attempts.push({jobId:query.jobId,providerId:cached.providerId,ok:true,fromCache:true,hitCount:hits.length,latencyMs:0,error:null});
    }else{
      const ordered=[...input.providers].sort((a,b)=>priority(providerHealth(a.id).status)-priority(providerHealth(b.id).status)||providerHealth(a.id).averageLatencyMs-providerHealth(b.id).averageLatencyMs);
      let succeeded=false;
      for(const provider of ordered){
        if(providerHealth(provider.id).status==='unhealthy'&&ordered.length>1)continue;
        if(base.estimatedCost+requestCost>policy.maxEstimatedCostPerRun){base.stoppedReason='cost-limit';break;}
        const started=Date.now(); base.providerRequests++; base.estimatedCost=Number((base.estimatedCost+requestCost).toFixed(4));
        try{
          hits=cleanHits(await provider.search(query,AbortSignal.timeout(8000)),policy.maxResultsPerQuery);
          const latency=Date.now()-started; recordProviderSuccess(provider.id,latency);
          base.attempts.push({jobId:query.jobId,providerId:provider.id,ok:true,fromCache:false,hitCount:hits.length,latencyMs:latency,error:null});
          cache.set(key(query),{expiresAt:Date.now()+policy.cacheTtlMs,providerId:provider.id,hits}); succeeded=true; break;
        }catch(error){
          const latency=Date.now()-started; const message=error instanceof Error?error.message:'Provider error'; recordProviderFailure(provider.id,latency,message);
          base.attempts.push({jobId:query.jobId,providerId:provider.id,ok:false,fromCache:false,hitCount:0,latencyMs:latency,error:message});
        }
      }
      if(base.stoppedReason==='cost-limit')break;
      base.executedQueries++;
      if(!succeeded)continue;
    }
    for(const hit of hits){
      processed.push(processDiscoveryResult({jobId:query.jobId,targetId:query.targetId,targetName:query.targetName,query:query.query,...hit},{industryKeywords:input.industryKeywords,knownUrls:input.knownUrls,maxAgeDays:input.maxAgeDays}));
    }
  }
  base.rejected=processed.filter(x=>x.status==='rejected').length;
  base.results=dedupeDiscoveryResults(processed);
  base.accepted=base.results.length;
  return {...base,status:base.stoppedReason?'budget-stopped':'completed'};
}
