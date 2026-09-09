export type LeadMilestone={title:string;url:string;source:string;sourceClass:string;publishedAt:string;stage:string};
export type LeadTimeline={id:string;headline:string;competitors:string[];geographies:string[];milestones:LeadMilestone[]};
export type LeadTimeResult={
  timelineId:string;headline:string;leadDays:number|null;status:'measurable'|'not-yet-confirmed'|'no-early-signal'|'same-day';
  firstSignal:LeadMilestone|null;confirmation:LeadMilestone|null;explanation:string;
};

function time(v:string){return new Date(v).getTime();}
function days(a:string,b:string){return Math.max(0,Math.floor((time(b)-time(a))/86400000));}
function isEarly(m:LeadMilestone){
  return m.stage==='first-signal'||m.sourceClass==='jobs'||/(markköp|rekryter|platschef|produktionschef|account manager|kommande uppdrag|etabler|investering)/i.test(m.title);
}
function isConfirmation(m:LeadMilestone){
  return m.sourceClass==='news'||m.stage==='decision-or-award'||m.stage==='execution'||/(beslut|tilldelning|kontrakt|avtal teckn|byggstart|driftsätt|invig|öppnar|pressmeddelande)/i.test(m.title);
}

export function measureLeadTime(timeline:LeadTimeline):LeadTimeResult{
  const ms=[...timeline.milestones].filter(x=>!Number.isNaN(time(x.publishedAt))).sort((a,b)=>time(a.publishedAt)-time(b.publishedAt));
  const firstSignal=ms.find(isEarly)??null;
  if(!firstSignal)return {timelineId:timeline.id,headline:timeline.headline,leadDays:null,status:'no-early-signal',firstSignal:null,confirmation:null,explanation:'Ingen tydligt klassad tidig signal finns i den aktuella beviskedjan.'};
  const confirmation=ms.find(x=>time(x.publishedAt)>=time(firstSignal.publishedAt)&&x!==firstSignal&&isConfirmation(x))??null;
  if(!confirmation)return {timelineId:timeline.id,headline:timeline.headline,leadDays:null,status:'not-yet-confirmed',firstSignal,confirmation:null,explanation:'En tidig signal finns, men ingen senare bred nyhet, beslut eller genomförandemilstolpe finns ännu i underlaget.'};
  const leadDays=days(firstSignal.publishedAt,confirmation.publishedAt);
  return {timelineId:timeline.id,headline:timeline.headline,leadDays,status:leadDays===0?'same-day':'measurable',firstSignal,confirmation,explanation:leadDays===0?'Tidig signal och senare bekräftelse inträffade samma kalenderdygn.':`Den första identifierade signalen föregick den senare bekräftelsen med ${leadDays} dagar i den aktuella beviskedjan.`};
}

export function buildLeadTimeSummary(timelines:LeadTimeline[]){
  const results=timelines.map(measureLeadTime);
  const measurable=results.filter(x=>x.leadDays!==null) as Array<LeadTimeResult&{leadDays:number}>;
  const ahead=measurable.filter(x=>x.leadDays>0);
  const averageLeadDays=ahead.length?Number((ahead.reduce((n,x)=>n+x.leadDays,0)/ahead.length).toFixed(1)):null;
  const best=ahead.sort((a,b)=>b.leadDays-a.leadDays)[0]??null;
  return {
    results,
    measurable:measurable.length,
    ahead:ahead.length,
    averageLeadDays,
    best,
    pendingConfirmation:results.filter(x=>x.status==='not-yet-confirmed').length,
    methodology:'Current evidence-chain lead time: earliest classified early signal to later news/decision/execution confirmation. Not a claim of historical product detection time until persistent first-seen storage is verified.'
  };
}
