import type { DiscoveryProvider, DiscoveryProviderHit, DiscoveryProviderQuery } from './discovery-provider';
import { providerHealth, recordProviderFailure, recordProviderSuccess } from './discovery-provider-health';

export type FailoverAttempt={
  providerId:string;
  ok:boolean;
  latencyMs:number;
  error:string|null;
  hitCount:number;
};
export type FailoverResult={
  providerId:string|null;
  hits:DiscoveryProviderHit[];
  attempts:FailoverAttempt[];
  exhausted:boolean;
};

function priority(status:string){
  return status==='healthy'?0:status==='unknown'?1:status==='degraded'?2:3;
}

export async function searchWithFailover(
  providers:DiscoveryProvider[],
  query:DiscoveryProviderQuery,
  signal?:AbortSignal,
):Promise<FailoverResult>{
  const ordered=[...providers].sort((a,b)=>{
    const ah=providerHealth(a.id),bh=providerHealth(b.id);
    return priority(ah.status)-priority(bh.status)||ah.averageLatencyMs-bh.averageLatencyMs;
  });
  const attempts:FailoverAttempt[]=[];
  for(const provider of ordered){
    if(providerHealth(provider.id).status==='unhealthy'&&ordered.length>1)continue;
    const started=Date.now();
    try{
      const hits=await provider.search(query,signal);
      const latency=Date.now()-started;
      recordProviderSuccess(provider.id,latency);
      attempts.push({providerId:provider.id,ok:true,latencyMs:latency,error:null,hitCount:hits.length});
      return {providerId:provider.id,hits,attempts,exhausted:false};
    }catch(error){
      const latency=Date.now()-started;
      const message=error instanceof Error?error.message:'Provider error';
      recordProviderFailure(provider.id,latency,message);
      attempts.push({providerId:provider.id,ok:false,latencyMs:latency,error:message,hitCount:0});
    }
  }
  return {providerId:null,hits:[],attempts,exhausted:true};
}
