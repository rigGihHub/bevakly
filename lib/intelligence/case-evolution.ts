import type { CaseSnapshot } from './case-history';

export type EvolutionStep={
  observedAt:string;
  score:number;
  scoreDelta:number|null;
  facts:number;
  factsDelta:number|null;
  stage:string;
  direction:string;
  addedSourceClasses:string[];
  changes:string[];
};

export type CaseEvolution={
  caseKey:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  firstObservedAt:string;
  lastObservedAt:string;
  observations:number;
  firstScore:number;
  latestScore:number;
  scoreDelta:number;
  firstStage:string;
  latestStage:string;
  trend:'strengthening'|'weakening'|'mixed'|'stable';
  steps:EvolutionStep[];
  explanation:string[];
  canCompare:boolean;
};

function stageRank(v:string){return v==='execution'?5:v==='decision-or-award'?4:v==='formal-process'?3:v==='corroborating'?2:1;}
function stageLabel(v:string){return v==='execution'?'Genomförande':v==='decision-or-award'?'Beslut/tilldelning':v==='formal-process'?'Formell process':v==='corroborating'?'Bekräftas':'Första signal';}
function uniq<T>(v:T[]){return [...new Set(v)];}

export function buildCaseEvolution(snapshots:CaseSnapshot[]):CaseEvolution|null{
  if(!snapshots.length)return null;
  const ordered=[...snapshots].sort((a,b)=>new Date(a.observedAt).getTime()-new Date(b.observedAt).getTime());
  const first=ordered[0],latest=ordered[ordered.length-1];
  const steps:EvolutionStep[]=ordered.map((s,i)=>{
    const prev=i?ordered[i-1]:null;
    const addedSourceClasses=prev?s.sourceClasses.filter(x=>!prev.sourceClasses.includes(x)):[...s.sourceClasses];
    const changes:string[]=[];
    if(prev){
      const scoreDelta=s.escalationScore-prev.escalationScore;
      const factsDelta=s.facts-prev.facts;
      if(scoreDelta>0)changes.push(`Score +${scoreDelta}`);
      if(scoreDelta<0)changes.push(`Score ${scoreDelta}`);
      if(factsDelta>0)changes.push(`${factsDelta} nya fakta`);
      if(factsDelta<0)changes.push(`${Math.abs(factsDelta)} färre fakta i aktuell kedja`);
      if(stageRank(s.stage)>stageRank(prev.stage))changes.push(`Processen gick till ${stageLabel(s.stage)}`);
      else if(stageRank(s.stage)<stageRank(prev.stage))changes.push(`Aktuell klassning backade till ${stageLabel(s.stage)}`);
      if(s.direction!==prev.direction)changes.push(`Riktning ändrades ${prev.direction} → ${s.direction}`);
      if(addedSourceClasses.length)changes.push(`Ny källtyp: ${addedSourceClasses.join(', ')}`);
    }else changes.push('Första sparade observationen');
    return {
      observedAt:s.observedAt,
      score:s.escalationScore,
      scoreDelta:prev?s.escalationScore-prev.escalationScore:null,
      facts:s.facts,
      factsDelta:prev?s.facts-prev.facts:null,
      stage:s.stage,
      direction:s.direction,
      addedSourceClasses,
      changes,
    };
  });
  const scoreDelta=latest.escalationScore-first.escalationScore;
  const stageDelta=stageRank(latest.stage)-stageRank(first.stage);
  const positive=steps.slice(1).filter(x=>(x.scoreDelta??0)>0||x.changes.some(c=>c.startsWith('Processen gick'))).length;
  const negative=steps.slice(1).filter(x=>(x.scoreDelta??0)<0||x.direction==='cooling').length;
  const trend:CaseEvolution['trend']=ordered.length<2?'stable':positive&&negative?'mixed':scoreDelta>=8||stageDelta>0?'strengthening':scoreDelta<=-8||stageDelta<0?'weakening':'stable';
  const explanation:string[]=[];
  if(ordered.length<2)explanation.push('Endast en sparad observation finns ännu – utvecklingen kan inte jämföras över tid.');
  else{
    explanation.push(`Score har gått ${first.escalationScore} → ${latest.escalationScore} (${scoreDelta>=0?'+':''}${scoreDelta}).`);
    if(stageDelta>0)explanation.push(`Processen har avancerat från ${stageLabel(first.stage)} till ${stageLabel(latest.stage)}.`);
    if(stageDelta<0)explanation.push(`Aktuell processklassning är lägre än vid första sparade observationen.`);
    const allAdded=uniq(steps.slice(1).flatMap(x=>x.addedSourceClasses));
    if(allAdded.length)explanation.push(`Nya källtyper har tillkommit: ${allAdded.join(', ')}.`);
    const factDelta=latest.facts-first.facts;
    if(factDelta>0)explanation.push(`${factDelta} fler fakta ingår nu i kedjan.`);
    if(latest.direction==='cooling')explanation.push('Den senaste signalriktningen är cooling, vilket drar ned aktualiteten.');
  }
  return {
    caseKey:first.caseKey,
    headline:latest.headline,
    competitors:latest.competitors,
    geographies:latest.geographies,
    firstObservedAt:first.observedAt,
    lastObservedAt:latest.observedAt,
    observations:ordered.length,
    firstScore:first.escalationScore,
    latestScore:latest.escalationScore,
    scoreDelta,
    firstStage:first.stage,
    latestStage:latest.stage,
    trend,
    steps,
    explanation,
    canCompare:ordered.length>=2,
  };
}

export function buildCaseEvolutions(snapshots:CaseSnapshot[],limit=8):CaseEvolution[]{
  const groups=new Map<string,CaseSnapshot[]>();
  for(const s of snapshots){const list=groups.get(s.caseKey)??[];list.push(s);groups.set(s.caseKey,list);}
  return [...groups.values()].map(buildCaseEvolution).filter((x):x is CaseEvolution=>Boolean(x))
    .sort((a,b)=>Number(b.canCompare)-Number(a.canCompare)||Math.abs(b.scoreDelta)-Math.abs(a.scoreDelta)||new Date(b.lastObservedAt).getTime()-new Date(a.lastObservedAt).getTime())
    .slice(0,Math.max(1,limit));
}

export function summarizeCaseEvolutions(items:CaseEvolution[]){
  return {
    total:items.length,
    comparable:items.filter(x=>x.canCompare).length,
    strengthening:items.filter(x=>x.trend==='strengthening').length,
    weakening:items.filter(x=>x.trend==='weakening').length,
    mixed:items.filter(x=>x.trend==='mixed').length,
  };
}
