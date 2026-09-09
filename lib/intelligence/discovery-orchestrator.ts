import type { DiscoveryProvider, DiscoveryProviderHit, DiscoveryProviderQuery, ProviderPolicy } from './discovery-provider';
import { defaultProviderPolicy } from './discovery-provider';
import { providerHealth, recordProviderFailure, recordProviderSuccess } from './discovery-provider-health';
import { dedupeDiscoveryResults, processDiscoveryResult, type DiscoveryProcessedResult } from './discovery-result-pipeline';
import { recoverArticleMetadata } from './article-recovery';
import { inferMunicipalDocumentDate } from './municipal-protocol-discovery';

export type DiscoveryOrchestratorRun={
  status:'waiting-for-provider'|'completed'|'budget-stopped';
  configuredProviders:string[];
  queuedJobs:number;
  executedQueries:number;
  providerRequests:number;
  cacheHits:number;
  estimatedCost:number;
  providerHits:number;
  processedResults:number;
  acceptedBeforeDedupe:number;
  accepted:number;
  rejected:number;
  hostRejected:number;
  dedupeDropped:number;
  recoveryAttempted:number;
  recoverySucceeded:number;
  recoveredAccepted:number;
  rejectionReasons:Record<string,number>;
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
  const base={configuredProviders:input.providers.map(x=>x.id),queuedJobs:input.queue.length,executedQueries:0,providerRequests:0,cacheHits:0,estimatedCost:0,providerHits:0,processedResults:0,acceptedBeforeDedupe:0,accepted:0,rejected:0,hostRejected:0,dedupeDropped:0,recoveryAttempted:0,recoverySucceeded:0,recoveredAccepted:0,rejectionReasons:{} as Record<string,number>,stoppedReason:null as string|null,attempts:[] as DiscoveryOrchestratorRun['attempts'],results:[] as DiscoveryProcessedResult[]};
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
    base.providerHits+=hits.length;
    for(const hit of hits){
      if(query.allowedHosts?.length){
        let hostname='';
        try{hostname=new URL(hit.url).hostname.toLocaleLowerCase('sv-SE').replace(/^www\./,'');}catch{}
        const allowed=query.allowedHosts.some(raw=>{
          const host=raw.toLocaleLowerCase('sv-SE').replace(/^www\./,'');
          return hostname===host||hostname.endsWith(`.${host}`);
        });
        if(!allowed){base.hostRejected++;continue;}
      }
      const protocolDate=query.sourceClass==='municipal-protocol'&&!hit.publishedAt?inferMunicipalDocumentDate(hit):null;
      const preparedHit=protocolDate?{...hit,publishedAt:protocolDate}:hit;
      let result=processDiscoveryResult({jobId:query.jobId,targetId:query.targetId,targetName:query.targetName,query:query.query,...preparedHit},{industryKeywords:input.industryKeywords,knownUrls:input.knownUrls,maxAgeDays:input.maxAgeDays});
      const recoverable=result.status==='rejected'&&['Publiceringsdatum saknas','Publiceringsdatum kunde inte tolkas','Saknar både branschmatchning och tidig signal'].includes(result.rejectionReason??'');
      // Recovery is intentionally capped: it is a second-chance path, not another crawler.
      if(recoverable&&base.recoveryAttempted<24){
        base.recoveryAttempted++;
        const recovered=await recoverArticleMetadata({url:preparedHit.url,keywords:input.industryKeywords,timeoutMs:5500});
        if(recovered.ok){
          base.recoverySucceeded++;
          const enrichedHit={...preparedHit,title:recovered.title||preparedHit.title,publishedAt:recovered.publishedAt||preparedHit.publishedAt,snippet:recovered.snippet||preparedHit.snippet};
          const retry=processDiscoveryResult({jobId:query.jobId,targetId:query.targetId,targetName:query.targetName,query:query.query,...enrichedHit},{industryKeywords:input.industryKeywords,knownUrls:input.knownUrls,maxAgeDays:input.maxAgeDays});
          if(result.status==='rejected'&&retry.status==='accepted')base.recoveredAccepted++;
          result=retry;
        }
      }
      processed.push(result);
    }
  }
  base.processedResults=processed.length;
  const acceptedBeforeDedupe=processed.filter(x=>x.status==='accepted');
  const rejected=processed.filter(x=>x.status==='rejected');
  base.acceptedBeforeDedupe=acceptedBeforeDedupe.length;
  base.rejected=rejected.length;
  for(const result of rejected){
    const reason=result.rejectionReason??'Okänd avvisningsorsak';
    base.rejectionReasons[reason]=(base.rejectionReasons[reason]??0)+1;
  }
  base.results=dedupeDiscoveryResults(processed);
  base.accepted=base.results.length;
  base.dedupeDropped=Math.max(0,base.acceptedBeforeDedupe-base.accepted);
  return {...base,status:base.stoppedReason?'budget-stopped':'completed'};
}
