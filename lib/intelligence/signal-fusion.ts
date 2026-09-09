import { canonicalizeCompetitorNames } from './entities';
import { assessCaseIdentityConfidence } from './case-identity-confidence';
export type FusionSourceClass='news'|'municipal'|'jobs'|'environmental'|'competition'|'planning'|'legal'|'authority'|'other';
export type FusionInput={id:string;title:string;url:string;publishedAt:string;sourceClass:FusionSourceClass;source:string;competitors:string[];geographies:string[];text:string;factConfidence?:'Låg'|'Medel'|'Hög'};
export type FusedSignal={id:string;headline:string;hypothesis:'expansion'|'facility-or-capacity'|'contract-or-market-move'|'regulatory-or-legal'|'multi-source-change';competitors:string[];geographies:string[];sourceClasses:FusionSourceClass[];independentSources:number;eventCount:number;firstSeen:string;latestSeen:string;interpretationConfidence:'Låg'|'Medel'|'Hög';factConfidence:'Låg'|'Medel'|'Hög';facts:Array<{title:string;url:string;source:string;sourceClass:FusionSourceClass;publishedAt:string}>;reasons:string[];watchNext:string[]};
const strategic=/(etabler|ny anläggning|kapacitet|investering|markköp|detaljplan|bygglov|miljötillstånd|samråd|kommande uppdrag|nytt uppdrag|förvärv|företagskoncentration|produktionschef|platschef|branch manager|production manager|account manager|upphandling|tilldelning)/i;
const expansion=/(etabler|växer|expander|bygga upp|kommande uppdrag|nytt uppdrag|produktionschef|platschef|branch manager|rekryter)/i;
const facility=/(anläggning|kapacitet|investering|markköp|detaljplan|bygglov|miljötillstånd|samråd|deponi|förbränning)/i;
const contract=/(upphandling|tilldelning|kontrakt|avtal|uppdrag|account manager|sälj)/i;
const legal=/(domstol|överklag|tillstånd|förelägg|konkurrensverket|företagskoncentration|miljöprövning)/i;
function norm(s:string){return s.toLocaleLowerCase('sv-SE').replace(/\s+/g,' ').trim();}
function uniq<T>(a:T[]){return [...new Set(a)];}
function days(a:string,b:string){return Math.abs(new Date(a).getTime()-new Date(b).getTime())/86400000;}
function hash(v:string){let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);}
function related(a:FusionInput,b:FusionInput){
  if(days(a.publishedAt,b.publishedAt)>45)return false;
  const ac=canonicalizeCompetitorNames(a.competitors).map(norm),bc=canonicalizeCompetitorNames(b.competitors).map(norm);
  const sharedCompetitor=ac.some(x=>bc.includes(x));
  if(sharedCompetitor){
    const identity=assessCaseIdentityConfidence({title:a.title,text:a.text,competitors:a.competitors,geographies:a.geographies},{title:b.title,text:b.text,competitors:b.competitors,geographies:b.geographies});
    return identity.allowFusion;
  }
  // Geography-only correlation is allowed only when neither event names a competitor.
  // This prevents competitor A and competitor B in the same city from being bridged into one case.
  if(ac.length||bc.length)return false;
  // Geography alone is too weak to establish case identity. Keep such events separate until another anchor appears.
  const sharedGeo=a.geographies.some(x=>b.geographies.map(norm).includes(norm(x)));
  return false&&sharedGeo&&strategic.test(`${a.title} ${a.text}`)&&strategic.test(`${b.title} ${b.text}`);
}
function confidenceRank(v:'Låg'|'Medel'|'Hög'){return v==='Hög'?3:v==='Medel'?2:1;}
function factConfidence(items:FusionInput[]):'Låg'|'Medel'|'Hög'{const vals=items.map(x=>x.factConfidence??'Medel');if(vals.some(x=>x==='Låg'))return 'Låg';return vals.every(x=>x==='Hög')?'Hög':'Medel';}
export function fuseSignals(input:FusionInput[],limit=12):FusedSignal[]{
  const sorted=[...input].filter(x=>x.publishedAt&&!Number.isNaN(new Date(x.publishedAt).getTime())).sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime());
  const seen=new Set<string>(); const groups:FusionInput[][]=[];
  for(const seed of sorted){if(seen.has(seed.id))continue;const group=[seed];seen.add(seed.id);let changed=true;while(changed){changed=false;for(const candidate of sorted){if(seen.has(candidate.id))continue;if(group.some(member=>related(member,candidate))){group.push(candidate);seen.add(candidate.id);changed=true;}}}groups.push(group);}
  return groups.filter(g=>g.length>=2&&uniq(g.map(x=>x.sourceClass)).length>=2).map(g=>{
    const classes=uniq(g.map(x=>x.sourceClass)); const sources=uniq(g.map(x=>norm(x.source))); const competitors=canonicalizeCompetitorNames(g.flatMap(x=>x.competitors)); const geographies=uniq(g.flatMap(x=>x.geographies)); const body=g.map(x=>`${x.title} ${x.text}`).join(' ');
    const hypothesis:FusedSignal['hypothesis']=expansion.test(body)&&classes.includes('jobs')?'expansion':facility.test(body)?'facility-or-capacity':contract.test(body)?'contract-or-market-move':legal.test(body)?'regulatory-or-legal':'multi-source-change';
    const highFact=g.filter(x=>(x.factConfidence??'Medel')==='Hög').length;
    let interpretationConfidence:FusedSignal['interpretationConfidence']='Låg';
    if(classes.length>=3&&sources.length>=3&&(competitors.length>0||geographies.length>0))interpretationConfidence='Hög';
    else if(classes.length>=2&&sources.length>=2&&(competitors.length>0||geographies.length>0))interpretationConfidence='Medel';
    const reasons=[`${g.length} händelser från ${classes.length} källklasser`,`${sources.length} distinkta källor`];if(competitors.length)reasons.push(`Gemensam konkurrent: ${competitors.slice(0,2).join(', ')}`);if(geographies.length)reasons.push(`Gemensam geografi: ${geographies.slice(0,2).join(', ')}`);if(highFact)reasons.push(`${highFact} händelser med hög faktasäkerhet`);
    const watchNext=hypothesis==='expansion'?['Miljötillstånd och samråd','Kommunala mark-/planärenden','Fler rekryteringar och nya uppdrag']:hypothesis==='facility-or-capacity'?['Miljöprövning och bygglov','Investeringsbeslut','Driftsättning och kapacitetsbesked']:hypothesis==='contract-or-market-move'?['Tilldelningsbeslut och avtal','Rekrytering i berörd geografi','Konkurrentens egna besked']:hypothesis==='regulatory-or-legal'?['Nya beslut och överklaganden','Villkor/tidsfrister','Följdeffekter för anläggning eller marknad']:['Nya oberoende källor','Kommunala/myndighetsbeslut','Konkurrentens egna aktiviteter'];
    const dates=g.map(x=>new Date(x.publishedAt).toISOString()).sort();
    const anchor=competitors[0]||geographies[0]||'Marknaden';
    const label=hypothesis==='expansion'?'möjlig expansion':hypothesis==='facility-or-capacity'?'möjlig anläggnings- eller kapacitetsförändring':hypothesis==='contract-or-market-move'?'möjlig kontrakts-/marknadsförändring':hypothesis==='regulatory-or-legal'?'möjlig regulatorisk/juridisk förändring':'möjlig marknadsförändring';
    return {id:`fusion-${hash(g.map(x=>x.id).sort().join('|'))}`,headline:`${anchor}: ${label}`,hypothesis,competitors,geographies,sourceClasses:classes,independentSources:sources.length,eventCount:g.length,firstSeen:dates[0],latestSeen:dates[dates.length-1],interpretationConfidence,factConfidence:factConfidence(g),facts:g.sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).map(x=>({title:x.title,url:x.url,source:x.source,sourceClass:x.sourceClass,publishedAt:x.publishedAt})),reasons,watchNext};
  }).filter(x=>x.interpretationConfidence!=='Låg').sort((a,b)=>confidenceRank(b.interpretationConfidence)-confidenceRank(a.interpretationConfidence)||b.eventCount-a.eventCount||new Date(b.latestSeen).getTime()-new Date(a.latestSeen).getTime()).slice(0,Math.max(1,limit));
}
export function sourceClassFromTarget(targetId:string):FusionSourceClass{if(targetId.startsWith('competitor-jobs:'))return 'jobs';if(targetId.startsWith('municipal-protocol:'))return 'municipal';if(targetId.includes('environment'))return 'environmental';if(targetId.includes('competition'))return 'competition';if(targetId.includes('planning'))return 'planning';if(targetId.includes('legal')||targetId.includes('court'))return 'legal';if(targetId.startsWith('public-record:')||targetId.startsWith('authority'))return 'authority';if(targetId.includes('news'))return 'news';return 'other';}
