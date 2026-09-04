import type { DiscoveryTarget, DiscoveryIntent } from './authority-discovery-plan';

export type DiscoveryJob = {
  id:string;
  targetId:string;
  targetName:string;
  kind:DiscoveryTarget['kind'];
  county?:string;
  priority:'core'|'extended';
  intent:DiscoveryIntent;
  query:string;
  activeSourceIds:string[];
  mode:'direct-source'|'search-required';
};

export type DiscoveryBatch = {
  batchKey:string;
  maxJobs:number;
  jobs:DiscoveryJob[];
  directSourceJobs:number;
  searchRequiredJobs:number;
  representedCounties:number;
  municipalityJobs:number;
  authorityJobs:number;
};

function hashString(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function dayKey(now:Date){
  return now.toISOString().slice(0,10);
}

function chooseIntent(target:DiscoveryTarget,seed:number){
  return target.intents[seed%target.intents.length] ?? target.intents[0];
}

function chooseQuery(target:DiscoveryTarget,seed:number){
  return target.queryHints[seed%target.queryHints.length] ?? target.name;
}

function targetScore(target:DiscoveryTarget,seed:number){
  let score=0;
  if(target.priority==='core') score+=1000;
  if(target.kind==='national-authority') score+=350;
  if(target.kind==='county-authority') score+=250;
  if(target.activeSourceIds.length>0) score+=180;
  // Stable daily rotation. Different targets move up on different days without randomness.
  score+=(hashString(`${target.id}|${seed}`)%180);
  return score;
}

export function buildDiscoveryBatch(
  targets:DiscoveryTarget[],
  now=new Date(),
  maxJobs=12,
):DiscoveryBatch{
  const safeMax=Math.max(1,Math.min(24,Math.floor(maxJobs)));
  const key=dayKey(now);
  const seed=hashString(key);

  const sorted=[...targets].sort((a,b)=>{
    const delta=targetScore(b,seed)-targetScore(a,seed);
    if(delta!==0) return delta;
    return a.id.localeCompare(b.id,'sv');
  });

  const jobs:DiscoveryJob[]=[];
  const countyUse=new Map<string,number>();
  let municipalCount=0;

  // Pass 1: national/county targets. Reserve capacity for municipalities so they cannot starve.
  const authorityCap=Math.max(1,Math.min(safeMax-1,Math.ceil(safeMax/2)));
  for(const target of sorted.filter(x=>x.kind!=='municipality')){
    if(jobs.length>=authorityCap) break;
    const localSeed=hashString(`${key}|${target.id}`);
    const intent=chooseIntent(target,localSeed);
    jobs.push({
      id:`${key}:${target.id}:${intent}`,
      targetId:target.id,targetName:target.name,kind:target.kind,county:target.county,
      priority:target.priority,intent,query:chooseQuery(target,localSeed),
      activeSourceIds:target.activeSourceIds,
      mode:target.activeSourceIds.length?'direct-source':'search-required',
    });
    if(target.county) countyUse.set(target.county,(countyUse.get(target.county)??0)+1);
  }

  // Pass 2: rotate municipalities, initially max one municipality per county.
  const municipal=sorted.filter(x=>x.kind==='municipality');
  for(const target of municipal){
    if(jobs.length>=safeMax) break;
    if(target.county && (countyUse.get(target.county)??0)>0) continue;
    const localSeed=hashString(`${key}|${target.id}`);
    const intent=chooseIntent(target,localSeed);
    jobs.push({
      id:`${key}:${target.id}:${intent}`,
      targetId:target.id,targetName:target.name,kind:target.kind,county:target.county,
      priority:target.priority,intent,query:chooseQuery(target,localSeed),
      activeSourceIds:target.activeSourceIds,
      mode:target.activeSourceIds.length?'direct-source':'search-required',
    });
    municipalCount++;
    if(target.county) countyUse.set(target.county,(countyUse.get(target.county)??0)+1);
  }

  // Pass 3: fill remaining capacity from the rotating municipality queue.
  if(jobs.length<safeMax){
    const used=new Set(jobs.map(x=>x.targetId));
    for(const target of municipal){
      if(jobs.length>=safeMax) break;
      if(used.has(target.id)) continue;
      const localSeed=hashString(`${key}|${target.id}`);
      const intent=chooseIntent(target,localSeed);
      jobs.push({
        id:`${key}:${target.id}:${intent}`,
        targetId:target.id,targetName:target.name,kind:target.kind,county:target.county,
        priority:target.priority,intent,query:chooseQuery(target,localSeed),
        activeSourceIds:target.activeSourceIds,
        mode:target.activeSourceIds.length?'direct-source':'search-required',
      });
      municipalCount++;
    }
  }

  const counties=new Set(jobs.map(x=>x.county).filter((x):x is string=>Boolean(x)));
  return {
    batchKey:key,
    maxJobs:safeMax,
    jobs,
    directSourceJobs:jobs.filter(x=>x.mode==='direct-source').length,
    searchRequiredJobs:jobs.filter(x=>x.mode==='search-required').length,
    representedCounties:counties.size,
    municipalityJobs:municipalCount,
    authorityJobs:jobs.length-municipalCount,
  };
}

export function buildSearchAdapterQueue(batch:DiscoveryBatch){
  return batch.jobs
    .filter(job=>job.mode==='search-required')
    .map(job=>({
      jobId:job.id,
      targetId:job.targetId,
      targetName:job.targetName,
      county:job.county??null,
      intent:job.intent,
      query:job.query,
      // Contract only: the future provider must return canonical result URLs and snippets.
      requiredFields:['title','url','publishedAt','snippet'] as const,
    }));
}
