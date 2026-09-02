import type { WatchSource, SourceScope, SourceType } from './sources';

export type SourceNetworkSummary = {
  total:number;
  enabled:number;
  byScope:Record<SourceScope,number>;
  byType:Partial<Record<SourceType,number>>;
  tier1:number;
  tier2:number;
  tier3:number;
};

export function summarizeSourceNetwork(sources:WatchSource[]):SourceNetworkSummary{
  const enabled=sources.filter(s=>s.enabled);
  const byScope:Record<SourceScope,number>={sweden:0,nordic:0,eu:0,international:0};
  const byType:Partial<Record<SourceType,number>>={};
  for(const source of enabled){
    byScope[source.scope]+=1;
    byType[source.type]=(byType[source.type]??0)+1;
  }
  return {
    total:sources.length,
    enabled:enabled.length,
    byScope,
    byType,
    tier1:enabled.filter(s=>s.tier===1).length,
    tier2:enabled.filter(s=>s.tier===2).length,
    tier3:enabled.filter(s=>s.tier===3).length,
  };
}

export function independentDomains(urls:string[]){
  const domains=new Set<string>();
  for(const url of urls){
    try{domains.add(new URL(url).hostname.replace(/^www\./,''));}catch{}
  }
  return domains.size;
}

export function evidenceLabel(independentSources:number, bestTier:number){
  if(independentSources>=3 && bestTier<=2) return 'Starkt källstöd';
  if(independentSources>=2) return 'Bekräftat från flera håll';
  if(bestTier===1) return 'Primär/officiell källa';
  return 'Enskild källa';
}
