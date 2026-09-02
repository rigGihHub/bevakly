import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { buildActorWatchlist, type ActorWatch, type ActorThemeShift } from "@/lib/intelligence/actor-watchlist";

export type ComparisonTheme = {
  theme: string;
  actors: { name: string; current30: number; previous30: number; delta: number; direction: ActorThemeShift["direction"] }[];
  leader: string | null;
  note: string;
};

export type ActorComparisonRow = {
  name: string;
  activity30: number;
  activity90: number;
  momentum: ActorWatch["momentum"];
  sourceDomains: number;
  averageScore: number;
  topCategory: string | null;
  topGeography: string | null;
  evidenceLevel: "stark" | "medel" | "tunn";
  breadthScore: number;
};

export type ActorComparison = {
  actors: ActorComparisonRow[];
  themes: ComparisonTheme[];
  observations: string[];
  caveats: string[];
};

function evidenceLevel(a:ActorWatch):ActorComparisonRow["evidenceLevel"]{
  if(a.independentSourceDomains>=3 && a.eventCount90d>=5) return "stark";
  if(a.independentSourceDomains>=2 && a.eventCount90d>=3) return "medel";
  return "tunn";
}
function breadth(a:ActorWatch){
  const categoryBreadth=Math.min(5,a.categories.length);
  const geoBreadth=Math.min(4,a.geographies.length);
  return Math.min(100,Math.round(a.independentSourceDomains*14+categoryBreadth*7+geoBreadth*5));
}
function themeNote(theme:string, actors:ComparisonTheme["actors"], leader:string|null){
  const rising=actors.filter(x=>x.direction==="ny"||x.direction==="accelererar");
  if(rising.length>=2) return `Flera aktörer visar ökad observerad aktivitet inom ${theme}.`;
  if(rising.length===1) return `${rising[0].name} är den enda jämförda aktören med tydligt ökad observerad aktivitet inom ${theme}.`;
  if(leader) return `${leader} har flest observerade händelser inom ${theme}, men ingen tydlig acceleration kan beläggas.`;
  return `Underlaget räcker inte för att skilja aktörerna åt inom ${theme}.`;
}

export function buildActorComparison(events:HistoricalEvent[], requestedActors:string[], now=new Date()):ActorComparison{
  const watches=buildActorWatchlist(events,requestedActors,now);
  const rows:ActorComparisonRow[]=watches.map(a=>({
    name:a.name,activity30:a.eventCount30d,activity90:a.eventCount90d,momentum:a.momentum,sourceDomains:a.independentSourceDomains,
    averageScore:a.averageScore,topCategory:a.categories[0]?.name??null,topGeography:a.geographies[0]?.name??null,evidenceLevel:evidenceLevel(a),breadthScore:breadth(a)
  }));

  const themeNames=[...new Set(watches.flatMap(a=>a.themeShifts.map(s=>s.theme)))];
  const themes=themeNames.map(theme=>{
    const actors=watches.map(a=>{
      const s=a.themeShifts.find(x=>x.theme===theme);
      return {name:a.name,current30:s?.current30??0,previous30:s?.previous30??0,delta:s?.delta??0,direction:s?.direction??"stabil" as ActorThemeShift["direction"]};
    });
    const sorted=[...actors].sort((a,b)=>b.current30-a.current30||b.delta-a.delta);
    const leader=sorted[0] && sorted[0].current30>0 && (sorted.length===1 || sorted[0].current30>sorted[1].current30) ? sorted[0].name : null;
    return {theme,actors,leader,note:themeNote(theme,actors,leader)};
  }).sort((a,b)=>{
    const power=(t:ComparisonTheme)=>Math.max(...t.actors.map(x=>x.current30+Math.max(0,x.delta)*2),0);
    return power(b)-power(a)||a.theme.localeCompare(b.theme,"sv");
  }).slice(0,8);

  const observations:string[]=[];
  const accelerating=rows.filter(x=>x.momentum==="accelererar");
  if(accelerating.length===1) observations.push(`${accelerating[0].name} är den enda jämförda aktören med tydligt accelererande total observerad aktivitet senaste 30 dagarna.`);
  else if(accelerating.length>1) observations.push(`${accelerating.map(x=>x.name).join(", ")} visar accelererande observerad aktivitet; jämför temana nedan för att se om rörelsen sker inom samma områden.`);
  const widest=[...rows].sort((a,b)=>b.breadthScore-a.breadthScore)[0];
  const second=[...rows].sort((a,b)=>b.breadthScore-a.breadthScore)[1];
  if(widest && (!second || widest.breadthScore>=second.breadthScore+15)) observations.push(`${widest.name} syns bredast i det observerade källunderlaget, över fler källor, kategorier eller geografier. Det kan delvis bero på större publiceringssynlighet.`);
  const uniqueTheme=themes.find(t=>t.actors.filter(x=>x.direction==="ny"||x.direction==="accelererar").length===1);
  if(uniqueTheme){const actor=uniqueTheme.actors.find(x=>x.direction==="ny"||x.direction==="accelererar");if(actor) observations.push(`${actor.name} skiljer ut sig inom ${uniqueTheme.theme}, där ökad aktivitet inte syns hos övriga jämförda aktörer.`)}
  if(!observations.length) observations.push("Ingen tydlig skillnad mellan aktörerna kan beläggas ännu. Fortsatt bevakning behövs innan en starkare jämförelse görs.");

  const caveats=[
    "Jämförelsen mäter observerad aktivitet i Bevaklys källor – inte företagens faktiska totala aktivitet.",
    "Fler pressmeddelanden eller bättre indexering kan ge högre synlighet utan att innebära större strategisk förändring.",
    "Tema- och momentumskillnader bör helst stödjas av flera oberoende källdomäner innan de används som stark beslutsgrund."
  ];
  return {actors:rows,themes,observations:observations.slice(0,4),caveats};
}
