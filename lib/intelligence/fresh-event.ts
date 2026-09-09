import type { ArticleExtraction } from './article';
import type { NewsProvenanceAssessment } from './news-provenance';

export type FreshEventClass='new-development'|'ongoing-development'|'background-or-resurfaced'|'uncertain';

export type FreshEventAssessment={
  classification:FreshEventClass;
  confidence:'Låg'|'Medel'|'Hög';
  freshnessAdjustment:number;
  publicationAgeDays:number|null;
  currentEventCues:string[];
  historicalCues:string[];
  olderYears:number[];
  reasons:string[];
  guardrail:string;
};

const CURRENT_CUES:Array<[RegExp,string]>=[
  [/(?:^|[^A-Za-zÅÄÖåäö])(inviger|invigdes|invigs|öppnar|öppnade|lanserar|lanserade)(?=$|[^A-Za-zÅÄÖåäö])/i,'öppnar/inviger'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(tecknar|tecknade|tecknat|vinner|vann|vunnit|tilldelar|tilldelade|tilldelas|tilldelades|får uppdrag|fick uppdrag|nya uppdrag|nytt avtal)(?=$|[^A-Za-zÅÄÖåäö])/i,'avtal/tilldelning'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(investerar|investerade|satsar|bygger|byggstart|utökar|expanderar|växer|beställer|rekordbeställning)(?=$|[^A-Za-zÅÄÖåäö])/i,'investering/expansion'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(ansöker|ansökte|beviljar|beviljade|beviljas|beviljades|beslutar|beslutade|godkänner|godkände|upphäver|upphävde)(?=$|[^A-Za-zÅÄÖåäö])/i,'formellt beslut/ansökan'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(förvärvar|förvärvade|köper|köpte|säljer|sålde)(?=$|[^A-Za-zÅÄÖåäö])/i,'förvärv/affär'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(rekryterar|utser|tillträder|avgår)(?=$|[^A-Za-zÅÄÖåäö])/i,'ledning/rekrytering'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(startar|startade|tar över|övertar|driftsätter|driftsatte|införs|inför|ansvarar)(?=$|[^A-Za-zÅÄÖåäö])/i,'operativ förändring'],
  [/(?:^|[^A-Za-zÅÄÖåäö])(höjer|höjde|höjs|sänker|sänkte|sänks|ändrar|ändrade|ändras|prisjusteringar|prisjustering)(?=$|[^A-Za-zÅÄÖåäö])/i,'pris-/kostnadsförändring'],
];

const HISTORICAL_CUES:Array<[RegExp,string]>=[
  [/\b(redan|tidigare|sedan tidigare|historiskt|bakgrund)\b/i,'bakgrundsspråk'],
  [/\b(förra året|föregående år|under 20\d{2})\b/i,'tidigare period'],
  [/\b(beslutades|tecknades|invigdes|startade|lanserades|förvärvades)\s+(?:redan\s+)?(?:under\s+|i\s+)?20\d{2}\b/i,'äldre händelse uttrycks explicit'],
  [/\b(sedan|sedan år)\s+20\d{2}\b/i,'sedan äldre år'],
];

function ageDays(publishedAt:string|null,now:Date){
 if(!publishedAt)return null;
 const t=new Date(publishedAt).getTime(); if(Number.isNaN(t))return null;
 return Math.floor((now.getTime()-t)/86400000);
}
function extractYears(text:string){
 return [...new Set([...text.matchAll(/\b(20\d{2})\b/g)].map(m=>Number(m[1])))].sort();
}
function cueHits(text:string,pairs:Array<[RegExp,string]>){
 return pairs.filter(([rx])=>rx.test(text)).map(([,label])=>label);
}

export function assessFreshEvent(input:{
 title:string;
 article:ArticleExtraction;
 publishedAt:string|null;
 provenance?:NewsProvenanceAssessment;
 now?:Date;
}):FreshEventAssessment{
 const now=input.now??new Date();
 const published=input.publishedAt?new Date(input.publishedAt):null;
 const pubYear=published&&!Number.isNaN(published.getTime())?published.getUTCFullYear():null;
 const text=`${input.title} ${input.article.description} ${input.article.textSample}`;
 const title=input.title.trim();
 const currentEventCues=cueHits(title,CURRENT_CUES);
 const bodyCurrentCues=cueHits(text,CURRENT_CUES);
 const historicalCues=cueHits(text,HISTORICAL_CUES);
 const years=extractYears(text);
 const olderYears=pubYear?years.filter(y=>y<pubYear):[];
 const publicationAgeDays=ageDays(input.publishedAt,now);
 const reasons:string[]=[];
 let classification:FreshEventClass='uncertain';
 let confidence:'Låg'|'Medel'|'Hög'='Låg';
 let freshnessAdjustment=0;

 const recentPublication=publicationAgeDays!==null&&publicationAgeDays>=0&&publicationAgeDays<=7;
 const historicalNarrative=/\b(?:historik|så byggdes|jubileum|tillbakablick|arkiv)\b/i.test(text);
 const oldYearDominant=olderYears.length>0&&currentEventCues.length===0&&(historicalCues.length>0||historicalNarrative);

 const titleYears=extractYears(title);
 const explicitOlderTitleYear=pubYear?titleYears.some(y=>y<pubYear):false;
 if(explicitOlderTitleYear&&historicalCues.length>0){
   classification='background-or-resurfaced'; confidence='Hög'; freshnessAdjustment=-16;
   reasons.push(`Rubriken anger ett äldre händelseår (${titleYears.filter(y=>!pubYear||y<pubYear).join(', ')}) trots en ny publicering.`);
 }else if(recentPublication&&currentEventCues.length>0){
   classification='new-development'; confidence='Hög'; freshnessAdjustment=6;
   reasons.push(`Rubriken innehåller tydlig förändringssignal: ${currentEventCues.join(', ')}.`);
 }else if(recentPublication&&bodyCurrentCues.length>0&&!oldYearDominant){
   classification='ongoing-development'; confidence='Medel'; freshnessAdjustment=2;
   reasons.push('Artikeln beskriver en aktuell förändring, men den tydliga förändringssignalen finns främst i brödtexten.');
 }else if(oldYearDominant){
   classification='background-or-resurfaced'; confidence='Hög'; freshnessAdjustment=-16;
   reasons.push(`Texten pekar på äldre händelseår (${olderYears.join(', ')}) och saknar tydlig ny förändringssignal i rubriken.`);
 }else if(historicalCues.length>=2&&currentEventCues.length===0){
   classification='background-or-resurfaced'; confidence='Medel'; freshnessAdjustment=-10;
   reasons.push('Flera bakgrundssignaler finns utan tydlig ny förändringssignal i rubriken.');
 }else if(publicationAgeDays!==null&&publicationAgeDays>30){
   classification='background-or-resurfaced'; confidence='Medel'; freshnessAdjustment=-8;
   reasons.push(`Publiceringen är ${publicationAgeDays} dagar gammal.`);
 }else{
   classification='uncertain'; confidence='Låg'; freshnessAdjustment=0;
   reasons.push('Källan räcker inte för att säkert skilja ny händelse från bakgrund; ingen freshness-justering görs.');
 }

 if(input.provenance?.republisher&&classification==='uncertain'){
   reasons.push('Pressdistribution används inte som bevis för att själva händelsen är ny.');
 }
 return {
   classification,confidence,freshnessAdjustment,publicationAgeDays,currentEventCues,
   historicalCues,olderYears,reasons,
   guardrail:'Fresh-event-klassning bedömer om texten beskriver en ny utveckling. Den ändrar inte källans publiceringsdatum och påstår inte ett exakt händelsedatum när källan saknar ett sådant.',
 };
}

export function summarizeFreshEvents(items:FreshEventAssessment[]){
 return {
   assessed:items.length,
   newDevelopment:items.filter(x=>x.classification==='new-development').length,
   ongoing:items.filter(x=>x.classification==='ongoing-development').length,
   backgroundOrResurfaced:items.filter(x=>x.classification==='background-or-resurfaced').length,
   uncertain:items.filter(x=>x.classification==='uncertain').length,
 };
}
