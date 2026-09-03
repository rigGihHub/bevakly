import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { buildCompetitorTrail, type CompetitorTrail } from "@/lib/intelligence/competitor-trail";
import { buildCompetitorChangePicture, type CompetitorChangePicture } from "@/lib/intelligence/competitor-change-picture";

export type ActorThemeShift = {
  theme: string;
  current30: number;
  previous30: number;
  direction: "accelererar" | "stabil" | "avtar" | "ny";
  delta: number;
};

export type ActorWatch = {
  name: string;
  eventCount30d: number;
  eventCount90d: number;
  averageScore: number;
  momentum: "accelererar" | "stabil" | "avtar";
  latestEventAt: string | null;
  independentSourceDomains: number;
  categories: { name: string; count: number }[];
  geographies: { name: string; count: number }[];
  themeShifts: ActorThemeShift[];
  headline: string;
  interpretation: string;
  watchNext: string[];
  timeline: HistoricalEvent[];
  trail: CompetitorTrail;
  changePicture: CompetitorChangePicture;
};

function ageDays(value: string | null, now: Date){
  if(!value) return Number.POSITIVE_INFINITY;
  const t=new Date(value).getTime();
  return Number.isNaN(t)?Number.POSITIVE_INFINITY:(now.getTime()-t)/86400000;
}
function uniq<T>(items:T[]){return [...new Set(items)]}
function topCounts(values:string[],limit=6){
  const m=new Map<string,number>();
  for(const v of values.filter(Boolean))m.set(v,(m.get(v)??0)+1);
  return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([name,count])=>({name,count}));
}
function domain(url?:string|null){try{return url?new URL(url).hostname.replace(/^www\./,''):null}catch{return null}}
function shiftFor(theme:string, rows:HistoricalEvent[], now:Date):ActorThemeShift{
  const current30=rows.filter(e=>e.category===theme&&ageDays(e.publishedAt,now)<=30).length;
  const previous30=rows.filter(e=>{const d=ageDays(e.publishedAt,now);return e.category===theme&&d>30&&d<=60}).length;
  const delta=current30-previous30;
  let direction:ActorThemeShift['direction']='stabil';
  if(current30>0&&previous30===0)direction='ny';
  else if(delta>=2 || (previous30>0&&current30/previous30>=1.5))direction='accelererar';
  else if(delta<=-2 || (previous30>0&&current30/previous30<=.5))direction='avtar';
  return {theme,current30,previous30,direction,delta};
}
function actorInterpretation(name:string, rows:HistoricalEvent[], shifts:ActorThemeShift[]){
  const rising=shifts.filter(s=>s.direction==='accelererar'||s.direction==='ny').slice(0,2);
  const latest=rows[0];
  if(rising.length){
    return `${name} visar just nu ökad observerad aktivitet inom ${rising.map(x=>x.theme).join(' och ')}. Det är en mönsterobservation från källorna, inte bevis för ett beslutat strategiskt skifte.`;
  }
  if(latest) return `${name} har observerad aktivitet, men underlaget visar ännu inget tydligt accelererande tema. Fortsatt bevakning behövs innan en starkare slutsats dras.`;
  return `Bevakly har för lite aktuellt underlag för att beskriva ${name}s riktning.`;
}
function watchNext(shifts:ActorThemeShift[], categories:string[]){
  const out:string[]=[];
  if(shifts.some(s=>['Investering','Etablering'].includes(s.theme)&&['accelererar','ny'].includes(s.direction))) out.push('nya anläggningar, tillstånd eller kapacitetsbesked');
  if(shifts.some(s=>['Teknik','Digitalisering'].includes(s.theme)&&['accelererar','ny'].includes(s.direction))) out.push('teknikpartnerskap, pilotprojekt och kommersiell utrullning');
  if(shifts.some(s=>['Organisation','Förvärv'].includes(s.theme)&&['accelererar','ny'].includes(s.direction))) out.push('ledningsförändringar, rekryteringar och förvärv');
  if(categories.includes('Regelverk')) out.push('hur aktören positionerar sig inför nya krav');
  if(categories.includes('Avtal')) out.push('nya kundavtal och geografisk expansion');
  return uniq(out).slice(0,4).length?uniq(out).slice(0,4):['nya investeringar, etableringar eller partnerskap','förändringar i ledning och organisation','återkommande aktivitet inom samma tema eller geografi'];
}

export function buildActorWatchlist(events:HistoricalEvent[], requestedActors:string[]=[], now=new Date()):ActorWatch[]{
  const discovered=uniq(events.flatMap(e=>e.competitors));
  const actors=uniq([...requestedActors.filter(Boolean),...discovered]);
  return actors.map(name=>{
    const rows=events.filter(e=>e.competitors.some(c=>c.toLocaleLowerCase('sv-SE')===name.toLocaleLowerCase('sv-SE'))&&ageDays(e.publishedAt,now)<=90)
      .sort((a,b)=>new Date(b.publishedAt??0).getTime()-new Date(a.publishedAt??0).getTime());
    const current30=rows.filter(e=>ageDays(e.publishedAt,now)<=30).length;
    const previous30=rows.filter(e=>{const d=ageDays(e.publishedAt,now);return d>30&&d<=60}).length;
    let momentum:ActorWatch['momentum']='stabil';
    if(current30>=previous30+2 || (previous30>0&&current30/previous30>=1.5))momentum='accelererar';
    else if(previous30>=current30+2 || (previous30>0&&current30/previous30<=.5))momentum='avtar';
    const categories=topCounts(rows.map(e=>e.category??'Övrigt'));
    const themes=uniq(rows.map(e=>e.category??'Övrigt'));
    const themeShifts=themes.map(t=>shiftFor(t,rows,now)).filter(s=>s.current30+s.previous30>0)
      .sort((a,b)=>{const rank=(x:ActorThemeShift['direction'])=>x==='ny'?3:x==='accelererar'?2:x==='avtar'?1:0;return rank(b.direction)-rank(a.direction)||b.current30-a.current30}).slice(0,6);
    const scores=rows.map(e=>e.relevanceScore).filter((x):x is number=>typeof x==='number');
    const domains=uniq(rows.map(e=>domain(e.sourceUrl)).filter((x):x is string=>Boolean(x)));
    return {
      name,eventCount30d:current30,eventCount90d:rows.length,averageScore:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0,momentum,latestEventAt:rows[0]?.publishedAt??null,
      independentSourceDomains:domains.length,categories,geographies:topCounts(rows.flatMap(e=>e.geography?e.geography.split(',').map(x=>x.trim()).filter(Boolean):[])),themeShifts,
      headline: current30?`${current30} observerade händelser senaste 30 dagarna`:'Ingen daterad händelse senaste 30 dagarna',
      interpretation:actorInterpretation(name,rows,themeShifts),watchNext:watchNext(themeShifts,categories.map(x=>x.name)),timeline:rows.slice(0,14),
      trail:buildCompetitorTrail(name,events,now),changePicture:buildCompetitorChangePicture(name,events,now)
    };
  }).filter(x=>requestedActors.length?requestedActors.some(a=>a.toLocaleLowerCase('sv-SE')===x.name.toLocaleLowerCase('sv-SE')):x.eventCount90d>0)
    .sort((a,b)=>b.eventCount30d-a.eventCount30d||b.eventCount90d-a.eventCount90d||b.averageScore-a.averageScore);
}
