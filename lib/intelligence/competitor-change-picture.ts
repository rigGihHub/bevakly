import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { classifyLocalSignal } from "@/lib/intelligence/local-signals";

export type ChangeConfidence = "hög" | "medel" | "låg";
export type ChangeDirection = "ökar" | "minskar" | "nytt" | "stabilt";

export type ChangeEvidence = {
  eventId: string;
  title: string;
  publishedAt: string | null;
  category: string | null;
  geography: string | null;
  sourceUrl?: string | null;
};

export type CompetitorChangePicture = {
  actor: string;
  headline: string;
  summary: string;
  confidence: ChangeConfidence;
  supportCount: number;
  independentDomains: number;
  changes: Array<{label:string;direction:ChangeDirection;detail:string}>;
  supportingEvidence: ChangeEvidence[];
  counterEvidence: ChangeEvidence[];
  caveat: string;
};

function ageDays(value:string|null, now:Date){
  if(!value)return Number.POSITIVE_INFINITY;
  const t=new Date(value).getTime();
  return Number.isNaN(t)?Number.POSITIVE_INFINITY:(now.getTime()-t)/86400000;
}
function domain(url?:string|null){try{return url?new URL(url).hostname.replace(/^www\./,""):null}catch{return null}}
function uniq<T>(rows:T[]){return [...new Set(rows)]}
function counts(rows:HistoricalEvent[], selector:(e:HistoricalEvent)=>string[]){
  const map=new Map<string,number>();
  for(const row of rows)for(const value of selector(row).filter(Boolean))map.set(value,(map.get(value)??0)+1);
  return map;
}
function evidence(row:HistoricalEvent):ChangeEvidence{return {eventId:row.id,title:row.title,publishedAt:row.publishedAt,category:row.category,geography:row.geography,sourceUrl:row.sourceUrl}}
function isNegative(row:HistoricalEvent){
  const t=`${row.title} ${row.category??""}`.toLowerCase();
  return /pausar|pausat|stoppar|stoppas|avbryt|lägger ned|läggs ned|stänger|nedlägg|försen|drar tillbaka|minskar kapacitet|begräns|avslag|nekas|varslar|uppsäg/.test(t);
}

export function buildCompetitorChangePicture(actor:string, events:HistoricalEvent[], now=new Date()):CompetitorChangePicture{
  const rows=events.filter(e=>e.competitors.some(c=>c.toLocaleLowerCase("sv-SE")===actor.toLocaleLowerCase("sv-SE"))&&ageDays(e.publishedAt,now)<=90)
    .sort((a,b)=>new Date(b.publishedAt??0).getTime()-new Date(a.publishedAt??0).getTime());
  const current=rows.filter(e=>ageDays(e.publishedAt,now)<=30);
  const previous=rows.filter(e=>{const d=ageDays(e.publishedAt,now);return d>30&&d<=60});
  const changes:CompetitorChangePicture["changes"]=[];
  const currentCategories=counts(current,e=>[e.category??"Övrigt"]);
  const previousCategories=counts(previous,e=>[e.category??"Övrigt"]);
  const themes=uniq([...currentCategories.keys(),...previousCategories.keys()]);
  for(const theme of themes){
    const cur=currentCategories.get(theme)??0, prev=previousCategories.get(theme)??0;
    if(cur>0&&prev===0)changes.push({label:theme,direction:"nytt",detail:`${cur} observerad${cur===1?" händelse":"e händelser"} senaste 30 dagarna och ingen i föregående period.`});
    else if(cur>=prev+2 || (prev>0&&cur/prev>=1.5))changes.push({label:theme,direction:"ökar",detail:`${cur} senaste 30 dagarna mot ${prev} föregående 30 dagar.`});
    else if(prev>=cur+2 || (prev>0&&cur/prev<=.5))changes.push({label:theme,direction:"minskar",detail:`${cur} senaste 30 dagarna mot ${prev} föregående 30 dagar.`});
  }
  const currentGeo=counts(current,e=>e.geography?e.geography.split(",").map(x=>x.trim()).filter(Boolean):[]);
  const previousGeo=counts(previous,e=>e.geography?e.geography.split(",").map(x=>x.trim()).filter(Boolean):[]);
  const newGeo=[...currentGeo.entries()].filter(([g])=>!previousGeo.has(g)).sort((a,b)=>b[1]-a[1]);
  if(newGeo.length)changes.push({label:"Geografi",direction:"nytt",detail:`Ny observerad geografi: ${newGeo.slice(0,3).map(([g])=>g).join(", ")}.`});
  const localStrong=current.filter(e=>{
    const s=classifyLocalSignal({title:`${e.title} ${e.category??""}`,source:domain(e.sourceUrl)??"",geographies:e.geography?e.geography.split(",").map(x=>x.trim()):[]});
    return s?.strength==="stark";
  });
  if(localStrong.length)changes.push({label:"Lokala försignaler",direction:"ökar",detail:`${localStrong.length} stark${localStrong.length===1?" lokal signal":"a lokala signaler"} senaste 30 dagarna.`});

  const counter=current.filter(isNegative);
  const positive=current.filter(e=>!isNegative(e));
  const domains=uniq(positive.map(e=>domain(e.sourceUrl)).filter((x):x is string=>Boolean(x)));
  let confidence:ChangeConfidence="låg";
  if(positive.length>=4&&domains.length>=3)confidence="hög";
  else if(positive.length>=2&&domains.length>=2)confidence="medel";
  if(counter.length>=Math.max(2,positive.length))confidence="låg";

  const rankedChanges=changes.sort((a,b)=>({"nytt":3,"ökar":2,"minskar":1,"stabilt":0}[b.direction]-{"nytt":3,"ökar":2,"minskar":1,"stabilt":0}[a.direction])).slice(0,5);
  let headline=`Ingen tydlig förändring kan beläggas för ${actor}`;
  if(rankedChanges.length){
    const lead=rankedChanges[0];
    headline=lead.direction==="nytt"?`Nytt mönster inom ${lead.label}`:lead.direction==="ökar"?`Ökad observerad aktivitet inom ${lead.label}`:`Minskad observerad aktivitet inom ${lead.label}`;
  }
  const summary=rankedChanges.length
    ? `${actor} visar ${rankedChanges.length} observerad${rankedChanges.length===1?" förändring":"e förändringar"} jämfört med föregående 30-dagarsperiod. Bilden bygger på publicerade källhändelser och ska läsas som förändringsindikator, inte som verifierad strategi.`
    : `${actor} har ${current.length} observerade händelser senaste 30 dagarna, men Bevakly ser ännu inget tillräckligt tydligt skifte mot föregående period.`;

  return {
    actor,headline,summary,confidence,supportCount:positive.length,independentDomains:domains.length,changes:rankedChanges,
    supportingEvidence:positive.slice(0,6).map(evidence),counterEvidence:counter.slice(0,4).map(evidence),
    caveat:"Källvolym och publiceringsbenägenhet kan påverka bilden. Motbevis visas separat och frånvaro av publicerade träffar betyder inte frånvaro av aktivitet."
  };
}
