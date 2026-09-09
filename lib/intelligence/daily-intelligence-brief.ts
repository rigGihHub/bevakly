export type DailyTimeline={id:string;headline:string;competitors:string[];geographies:string[];latestSeen:string;stage:string;direction:string;escalationScore:number;facts:number;sourceClasses:string[];watchNext:string[]};
export type DailyFollowed={headline:string;competitors:string[];geographies:string[];status:string;lastScore:number;lastFacts:number};
export type DailyBrief={generatedAt:string;changes:DailyTimeline[];strengthened:DailyTimeline[];competitor:{name:string;score:number;signals:number}|null;watchToday:string[];followedAttention:DailyFollowed[];empty:boolean};

export function buildDailyIntelligenceBrief(timelines:DailyTimeline[],followed:DailyFollowed[]=[],now=new Date()):DailyBrief{
 const ranked=[...timelines].sort((a,b)=>b.escalationScore-a.escalationScore||new Date(b.latestSeen).getTime()-new Date(a.latestSeen).getTime());
 const changes=ranked.slice(0,3);
 const strengthened=ranked.filter(x=>x.direction==='escalating').slice(0,2);
 const scores=new Map<string,{score:number;signals:number}>();
 for(const t of ranked)for(const name of t.competitors){const p=scores.get(name)??{score:0,signals:0};scores.set(name,{score:p.score+t.escalationScore,signals:p.signals+1});}
 const competitor=[...scores.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.score-a.score||b.signals-a.signals)[0]??null;
 const watchToday=[...new Set(changes.flatMap(x=>x.watchNext))].slice(0,4);
 const followedAttention=followed.filter(x=>['strengthening','weakening','missing'].includes(x.status)).sort((a,b)=>b.lastScore-a.lastScore).slice(0,3);
 return {generatedAt:now.toISOString(),changes,strengthened,competitor,watchToday,followedAttention,empty:ranked.length===0};
}
