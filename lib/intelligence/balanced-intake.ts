export type IntakeCandidate={url:string;sourceId:string;sourceType:string;sourceTier:number;trustScore:number};

export type BalancedIntakeDiagnostics={
  input:number;
  selected:number;
  droppedByBudget:number;
  representedSources:number;
  representedTypes:number;
  reservedCompetitor:number;
  reservedTier1:number;
  principle:string;
};

function keyOf<T extends IntakeCandidate>(item:T){return item.url.replace(/[?#].*$/,'').replace(/\/$/,'')}

export function selectBalancedIntake<T extends IntakeCandidate>(items:T[],limit=120):{items:T[];diagnostics:BalancedIntakeDiagnostics}{
  const unique=[...new Map(items.map(item=>[keyOf(item),item] as const)).values()];
  if(unique.length<=limit){
    return {items:unique,diagnostics:{input:unique.length,selected:unique.length,droppedByBudget:0,representedSources:new Set(unique.map(x=>x.sourceId)).size,representedTypes:new Set(unique.map(x=>x.sourceType)).size,reservedCompetitor:unique.filter(x=>x.sourceType==='competitor').length,reservedTier1:unique.filter(x=>x.sourceTier===1).length,principle:'Alla unika kandidater ryms inom intake-budgeten.'}};
  }
  const selected:T[]=[]; const selectedKeys=new Set<string>();
  const take=(pool:T[],count:number)=>{
    for(const item of pool){if(selected.length>=limit||count<=0)break;const key=keyOf(item);if(selectedKeys.has(key))continue;selected.push(item);selectedKeys.add(key);count--;}
  };
  const byPriority=[...unique].sort((a,b)=>a.sourceTier-b.sourceTier||b.trustScore-a.trustScore);
  const competitors=byPriority.filter(x=>x.sourceType==='competitor');
  const tier1=byPriority.filter(x=>x.sourceTier===1);
  take(competitors,Math.min(24,Math.ceil(limit*0.2)));
  take(tier1,Math.min(36,Math.ceil(limit*0.3)));
  const bySource=new Map<string,T[]>();
  for(const item of byPriority){const arr=bySource.get(item.sourceId)??[];arr.push(item);bySource.set(item.sourceId,arr)}
  let progress=true;
  while(selected.length<limit&&progress){
    progress=false;
    for(const arr of bySource.values()){
      const next=arr.find(item=>!selectedKeys.has(keyOf(item)));
      if(!next)continue; selected.push(next); selectedKeys.add(keyOf(next)); progress=true; if(selected.length>=limit)break;
    }
  }
  take(byPriority,limit-selected.length);
  return {items:selected,diagnostics:{input:unique.length,selected:selected.length,droppedByBudget:Math.max(0,unique.length-selected.length),representedSources:new Set(selected.map(x=>x.sourceId)).size,representedTypes:new Set(selected.map(x=>x.sourceType)).size,reservedCompetitor:selected.filter(x=>x.sourceType==='competitor').length,reservedTier1:selected.filter(x=>x.sourceTier===1).length,principle:'Intake-budgeten reserverar plats för konkurrentkällor och Tier 1 och fyller därefter round-robin per källa innan ren prioritet används.'}};
}
