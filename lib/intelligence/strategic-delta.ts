import type { CaseSnapshot } from './case-history';

export type DeltaTheme='contracts'|'capacity'|'permits'|'planning'|'m-and-a'|'investment'|'pricing'|'jobs'|'legal'|'other';
export type DeltaDirection='surging'|'rising'|'stable'|'falling'|'new-pattern';
export type StrategicDelta={
  competitor:string; theme:DeltaTheme; direction:DeltaDirection;
  recentSignals:number; baselineSignals:number; recentRate:number; baselineRate:number; ratio:number|null;
  recentStages:string[]; baselineStages:string[]; latestObservedAt:string;
  evidenceCaseKeys:string[]; reasons:string[]; confidence:'low'|'medium'|'high';
  guardrail:string;
};

const patterns:Array<[DeltaTheme,RegExp]>=[
 ['contracts',/(kontrakt|tilldel|upphandling|avtal|uppdrag)/i],
 ['capacity',/(kapacitet|anläggning|terminal|behandling|driftsätt|byggstart)/i],
 ['permits',/(miljötillstånd|miljöpröv|samråd|tillstånd)/i],
 ['planning',/(markanvis|markköp|detaljplan|planbesked|bygglov|fastighet)/i],
 ['m-and-a',/(förvärv|fusion|företagskoncentration|köper|förvärvar)/i],
 ['investment',/(investering|investerar|miljon|miljard)/i],
 ['pricing',/(pris|avgift|kostnad|materialvärde|index)/i],
 ['jobs',/(rekryter|jobb|platschef|produktionschef|karriär)/i],
 ['legal',/(domstol|överklag|förelägg|lagändring|förordning|reglering)/i],
];
function themeOf(s:CaseSnapshot):DeltaTheme{const text=`${s.headline} ${s.stage} ${s.sourceClasses.join(' ')}`;return patterns.find(([,r])=>r.test(text))?.[0]??'other';}
function days(a:string,b:string){return (new Date(b).getTime()-new Date(a).getTime())/86400000;}
function uniq<T>(v:T[]){return [...new Set(v)];}

/**
 * Compares a competitor with its own observed history. This is activity drift, not proof of strategy.
 * Multiple snapshots of the same case are collapsed to the latest observation inside each window.
 */
export function buildStrategicDeltas(snapshots:CaseSnapshot[],now=new Date(),recentDays=30,baselineDays=90):StrategicDelta[]{
 const nowIso=now.toISOString();
 const byCase=new Map<string,CaseSnapshot[]>();
 for(const s of snapshots){if(days(s.observedAt,nowIso)<0||days(s.observedAt,nowIso)>recentDays+baselineDays)continue;const a=byCase.get(s.caseKey)??[];a.push(s);byCase.set(s.caseKey,a);}
 const observations=[...byCase.values()].flatMap(group=>{
   const recent=group.filter(s=>days(s.observedAt,nowIso)<=recentDays).sort((a,b)=>+new Date(b.observedAt)-+new Date(a.observedAt))[0];
   const base=group.filter(s=>{const d=days(s.observedAt,nowIso);return d>recentDays&&d<=recentDays+baselineDays;}).sort((a,b)=>+new Date(b.observedAt)-+new Date(a.observedAt))[0];
   return [recent,base].filter((x):x is CaseSnapshot=>Boolean(x));
 });
 const keys=new Set<string>();
 for(const s of observations)for(const c of s.competitors)keys.add(`${c}|||${themeOf(s)}`);
 const out:StrategicDelta[]=[];
 for(const key of keys){
   const [competitor,themeRaw]=key.split('|||'); const theme=themeRaw as DeltaTheme;
   const rel=observations.filter(s=>s.competitors.includes(competitor)&&themeOf(s)===theme);
   const recent=rel.filter(s=>days(s.observedAt,nowIso)<=recentDays);
   const base=rel.filter(s=>{const d=days(s.observedAt,nowIso);return d>recentDays&&d<=recentDays+baselineDays;});
   const recentCases=uniq(recent.map(s=>s.caseKey)); const baseCases=uniq(base.map(s=>s.caseKey));
   const recentRate=recentCases.length/recentDays*30; const baselineRate=baseCases.length/baselineDays*30;
   const ratio=baselineRate>0?recentRate/baselineRate:null;
   let direction:DeltaDirection='stable';
   if(recentCases.length>=2&&baseCases.length===0)direction='new-pattern';
   else if(recentCases.length>=3&&ratio!==null&&ratio>=2)direction='surging';
   else if(recentCases.length>=2&&ratio!==null&&ratio>=1.4)direction='rising';
   else if(baseCases.length>=3&&recentRate<=baselineRate*.55)direction='falling';
   const reasons:string[]=[];
   if(direction==='new-pattern')reasons.push(`${recentCases.length} separata observerade case senaste ${recentDays} dagarna, inga i jämförelsefönstret.`);
   if(direction==='surging'||direction==='rising')reasons.push(`Observerad takt ${recentRate.toFixed(1)}/30d jämfört med ${baselineRate.toFixed(1)}/30d i baslinjen.`);
   if(direction==='falling')reasons.push(`Observerad aktivitet är lägre än den historiska baslinjen; frånvaro är inte bevis på minskad verklig aktivitet.`);
   const stageProgress=recent.some(s=>['formal-process','decision-or-award','execution'].includes(s.stage));
   if(stageProgress)reasons.push('Det senaste fönstret innehåller minst ett formellt process-, besluts- eller genomförandesteg.');
   const confidence:StrategicDelta['confidence']=baseCases.length>=3&&recentCases.length>=3?'high':(baseCases.length+recentCases.length>=4?'medium':'low');
   if(direction!=='stable')out.push({competitor,theme,direction,recentSignals:recentCases.length,baselineSignals:baseCases.length,recentRate,baselineRate,ratio,recentStages:uniq(recent.map(s=>s.stage)),baselineStages:uniq(base.map(s=>s.stage)),latestObservedAt:[...recent,...base].sort((a,b)=>+new Date(b.observedAt)-+new Date(a.observedAt))[0]?.observedAt??nowIso,evidenceCaseKeys:recentCases,reasons,confidence,guardrail:'Strategic delta mäter förändring i Bevaklys observerade aktivitet, inte bevisad förändring i konkurrentens verkliga strategi eller sannolikhet.'});
 }
 return out.sort((a,b)=>({surging:4,'new-pattern':3,rising:2,falling:1,stable:0}[b.direction]-{surging:4,'new-pattern':3,rising:2,falling:1,stable:0}[a.direction])||b.recentSignals-a.recentSignals);
}

export function summarizeStrategicDeltas(items:StrategicDelta[]){return {total:items.length,surging:items.filter(x=>x.direction==='surging').length,newPatterns:items.filter(x=>x.direction==='new-pattern').length,rising:items.filter(x=>x.direction==='rising').length,falling:items.filter(x=>x.direction==='falling').length,guardrail:'Delta = observerad förändring mot egen historisk baslinje; inte sannolikhet eller bevisad strategi.'};}
