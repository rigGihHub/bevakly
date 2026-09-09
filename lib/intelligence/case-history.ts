import { followedCaseKey } from './followed-changes';

export type CaseTimelineInput={
  id:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  firstSeen:string;
  latestSeen:string;
  stage:string;
  direction:string;
  escalationScore:number;
  interpretationConfidence:string;
  facts:number;
  sourceClasses:string[];
};

export type CaseSnapshot={
  caseKey:string;
  timelineId:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  observedAt:string;
  evidenceFirstSeen:string;
  evidenceLatestSeen:string;
  stage:string;
  direction:string;
  escalationScore:number;
  interpretationConfidence:string;
  facts:number;
  sourceClasses:string[];
};

export type CaseHistoryRecord={
  caseKey:string;
  firstObservedAt:string;
  lastObservedAt:string;
  observationCount:number;
  latest:CaseSnapshot;
  scoreMin:number;
  scoreMax:number;
  stageHistory:string[];
  directionHistory:string[];
};

export function buildCaseSnapshots(timelines:CaseTimelineInput[],observedAt=new Date().toISOString()):CaseSnapshot[]{
  return timelines.map(t=>({
    caseKey:followedCaseKey(t),
    timelineId:t.id,
    headline:t.headline,
    competitors:[...t.competitors],
    geographies:[...t.geographies],
    observedAt,
    evidenceFirstSeen:t.firstSeen,
    evidenceLatestSeen:t.latestSeen,
    stage:t.stage,
    direction:t.direction,
    escalationScore:t.escalationScore,
    interpretationConfidence:t.interpretationConfidence,
    facts:t.facts,
    sourceClasses:[...t.sourceClasses],
  }));
}

export function aggregateCaseHistory(snapshots:CaseSnapshot[]):CaseHistoryRecord[]{
  const groups=new Map<string,CaseSnapshot[]>();
  for(const s of snapshots){
    const list=groups.get(s.caseKey)??[];
    list.push(s);
    groups.set(s.caseKey,list);
  }
  return [...groups.entries()].map(([caseKey,list])=>{
    const ordered=[...list].sort((a,b)=>new Date(a.observedAt).getTime()-new Date(b.observedAt).getTime());
    const latest=ordered[ordered.length-1];
    return {
      caseKey,
      firstObservedAt:ordered[0].observedAt,
      lastObservedAt:latest.observedAt,
      observationCount:ordered.length,
      latest,
      scoreMin:Math.min(...ordered.map(x=>x.escalationScore)),
      scoreMax:Math.max(...ordered.map(x=>x.escalationScore)),
      stageHistory:[...new Set(ordered.map(x=>x.stage))],
      directionHistory:[...new Set(ordered.map(x=>x.direction))],
    };
  }).sort((a,b)=>new Date(b.lastObservedAt).getTime()-new Date(a.lastObservedAt).getTime());
}
