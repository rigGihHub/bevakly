export type FollowedChangeStatus='strengthening'|'stable'|'weakening'|'missing'|'closed';
export type FollowedChange={
  id:string;
  caseKey:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  hypothesis:string|null;
  followedAt:string;
  lastMatchedAt:string;
  lastScore:number;
  lastFacts:number;
  lastStage:string;
  status:FollowedChangeStatus;
};

export type FollowableTimeline={
  id:string;
  headline:string;
  competitors:string[];
  geographies:string[];
  escalationScore:number;
  facts:number;
  stage:string;
  direction:string;
};

function norm(v:string){return v.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').replace(/\s+/g,' ').trim();}
function uniq(v:string[]){return [...new Set(v.map(norm).filter(Boolean))].sort();}
function h(v:string){let x=2166136261;for(let i=0;i<v.length;i++){x^=v.charCodeAt(i);x=Math.imul(x,16777619);}return (x>>>0).toString(16);}

export function followedCaseKey(item:Pick<FollowableTimeline,'competitors'|'geographies'|'headline'>){
  const competitors=uniq(item.competitors);
  const geographies=uniq(item.geographies);
  // Entity first; geography second. Headline contributes only when both are absent.
  const basis=competitors.length
    ?`competitor:${competitors.join('|')}|geo:${geographies.join('|')||'*'}`
    :geographies.length
      ?`geo:${geographies.join('|')}`
      :`headline:${norm(item.headline)}`;
  return `case-${h(basis)}`;
}

export function createFollowedChange(item:FollowableTimeline,now=new Date()):FollowedChange{
  return {
    id:`follow-${followedCaseKey(item)}`,
    caseKey:followedCaseKey(item),
    headline:item.headline,
    competitors:[...item.competitors],
    geographies:[...item.geographies],
    hypothesis:null,
    followedAt:now.toISOString(),
    lastMatchedAt:now.toISOString(),
    lastScore:item.escalationScore,
    lastFacts:item.facts,
    lastStage:item.stage,
    status:item.direction==='escalating'?'strengthening':item.direction==='cooling'?'weakening':'stable',
  };
}

function rankStage(v:string){return v==='execution'?5:v==='decision-or-award'?4:v==='formal-process'?3:v==='corroborating'?2:1;}

export function reconcileFollowedChanges(saved:FollowedChange[],current:FollowableTimeline[],now=new Date()):FollowedChange[]{
  const byKey=new Map(current.map(x=>[followedCaseKey(x),x] as const));
  return saved.map(previous=>{
    if(previous.status==='closed')return previous;
    const match=byKey.get(previous.caseKey);
    if(!match){
      const age=Math.max(0,(now.getTime()-new Date(previous.lastMatchedAt).getTime())/86400000);
      return {...previous,status:age>30?'missing':age>14?'weakening':'stable'};
    }
    const scoreDelta=match.escalationScore-previous.lastScore;
    const factDelta=match.facts-previous.lastFacts;
    const stageDelta=rankStage(match.stage)-rankStage(previous.lastStage);
    const status:FollowedChangeStatus=
      match.direction==='cooling'||scoreDelta<=-12?'weakening':
      match.direction==='escalating'||scoreDelta>=8||factDelta>0||stageDelta>0?'strengthening':'stable';
    return {...previous,headline:match.headline,competitors:[...match.competitors],geographies:[...match.geographies],lastMatchedAt:now.toISOString(),lastScore:match.escalationScore,lastFacts:match.facts,lastStage:match.stage,status};
  });
}

export function statusLabel(status:FollowedChangeStatus){
  return status==='strengthening'?'Stärks':status==='weakening'?'Försvagas':status==='missing'?'Ingen ny träff':status==='closed'?'Avslutad':'Stabil';
}
