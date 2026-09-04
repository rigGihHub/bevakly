import type { DiscoveryProvider, DiscoveryProviderHit, DiscoveryProviderQuery } from './discovery-provider';

export type ProviderHealthStatus='healthy'|'degraded'|'unhealthy'|'unknown';

export type ProviderHealthSnapshot={
  providerId:string;
  status:ProviderHealthStatus;
  totalRequests:number;
  successes:number;
  failures:number;
  successRate:number;
  averageLatencyMs:number;
  consecutiveFailures:number;
  lastSuccessAt:string|null;
  lastFailureAt:string|null;
  lastError:string|null;
};

type MutableHealth={
  providerId:string;
  totalRequests:number;
  successes:number;
  failures:number;
  totalLatencyMs:number;
  consecutiveFailures:number;
  lastSuccessAt:string|null;
  lastFailureAt:string|null;
  lastError:string|null;
};

const healthStore=new Map<string,MutableHealth>();

function state(providerId:string):MutableHealth{
  const existing=healthStore.get(providerId);
  if(existing)return existing;
  const created:MutableHealth={
    providerId,totalRequests:0,successes:0,failures:0,totalLatencyMs:0,consecutiveFailures:0,
    lastSuccessAt:null,lastFailureAt:null,lastError:null,
  };
  healthStore.set(providerId,created);
  return created;
}

export function recordProviderSuccess(providerId:string,latencyMs:number){
  const s=state(providerId);
  s.totalRequests++;s.successes++;s.totalLatencyMs+=Math.max(0,latencyMs);s.consecutiveFailures=0;
  s.lastSuccessAt=new Date().toISOString();s.lastError=null;
}
export function recordProviderFailure(providerId:string,latencyMs:number,error:string){
  const s=state(providerId);
  s.totalRequests++;s.failures++;s.totalLatencyMs+=Math.max(0,latencyMs);s.consecutiveFailures++;
  s.lastFailureAt=new Date().toISOString();s.lastError=error.slice(0,300);
}
export function providerHealth(providerId:string):ProviderHealthSnapshot{
  const s=state(providerId);
  const successRate=s.totalRequests?s.successes/s.totalRequests:0;
  const averageLatencyMs=s.totalRequests?Math.round(s.totalLatencyMs/s.totalRequests):0;
  let status:ProviderHealthStatus='unknown';
  if(s.totalRequests>0){
    if(s.consecutiveFailures>=3||successRate<0.5)status='unhealthy';
    else if(s.consecutiveFailures>=1||successRate<0.85||averageLatencyMs>4000)status='degraded';
    else status='healthy';
  }
  return {...s,status,successRate:Number(successRate.toFixed(3)),averageLatencyMs};
}
export function allProviderHealth(){
  return [...healthStore.keys()].map(providerHealth).sort((a,b)=>{
    const rank=(x:ProviderHealthStatus)=>x==='healthy'?0:x==='degraded'?1:x==='unknown'?2:3;
    return rank(a.status)-rank(b.status)||b.successRate-a.successRate;
  });
}

export class PlaceholderSearchProvider implements DiscoveryProvider{
  id='placeholder-search';
  async search(_query:DiscoveryProviderQuery):Promise<DiscoveryProviderHit[]>{
    throw new Error('Ingen extern sökprovider är konfigurerad');
  }
}
