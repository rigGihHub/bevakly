import { classifyLocalSignal, type LocalSignalType } from './local-signals';
import { findMunicipalityByExplicitGeography, findMunicipalityInText } from './municipality-registry';

export type GeographyConfidence = 'Låg' | 'Medel' | 'Hög';
export type MarketRegion = 'Norrland' | 'Svealand' | 'Götaland' | 'Okänd';

export type GeographicEvent = {
  title:string;
  url:string;
  source:string;
  publishedAt:string;
  factualSummary?:string;
  geographies:string[];
  independentSourceCount?:number;
};

export type GeographicSignal = {
  event: GeographicEvent;
  signalType: LocalSignalType;
  strength: 'stark'|'medel'|'svag';
  municipality:string|null;
  county:string|null;
  marketRegion:MarketRegion;
  geographyLabel:string;
  geographyConfidence:GeographyConfidence;
  actor:string|null;
};

export type GeographicChange = {
  level:'kommun'|'län'|'region';
  label:string;
  current30:number;
  previous30:number;
  delta:number;
  signalTypes:LocalSignalType[];
  actors:string[];
  evidence:GeographicSignal[];
  confidence:GeographyConfidence;
  assessment:string;
};

const competitors=['PreZero','Ragn-Sells','Stena Recycling','Remondis','Verdis','Ohlssons'];

const countyRegion: Record<string, MarketRegion> = {
  'stockholms län':'Svealand','uppsala län':'Svealand','södermanlands län':'Svealand','värmlands län':'Svealand',
  'örebro län':'Svealand','västmanlands län':'Svealand','dalarnas län':'Svealand',
  'östergötlands län':'Götaland','jönköpings län':'Götaland','kronobergs län':'Götaland','kalmar län':'Götaland',
  'gotlands län':'Götaland','blekinge län':'Götaland','skåne län':'Götaland','hallands län':'Götaland',
  'västra götalands län':'Götaland','gävleborgs län':'Norrland','västernorrlands län':'Norrland',
  'jämtlands län':'Norrland','västerbottens län':'Norrland','norrbottens län':'Norrland'
};

const aliases: Array<[RegExp,string,MarketRegion]> = [
  [/\bstockholm\b/i,'Stockholms län','Svealand'],[/\buppsala\b/i,'Uppsala län','Svealand'],
  [/\bsörmland\b|\bsödermanland\b/i,'Södermanlands län','Svealand'],[/\bvärmland\b/i,'Värmlands län','Svealand'],
  [/\börebro\b/i,'Örebro län','Svealand'],[/\bvästmanland\b|\bvästerås\b/i,'Västmanlands län','Svealand'],
  [/\bdalarna\b|\bfalun\b|\bborlänge\b/i,'Dalarnas län','Svealand'],
  [/\böstergötland\b|\blinköping\b|\bnorrköping\b/i,'Östergötlands län','Götaland'],
  [/\bjönköping\b/i,'Jönköpings län','Götaland'],[/\bkronoberg\b|\bväxjö\b/i,'Kronobergs län','Götaland'],
  [/\bkalmar\b/i,'Kalmar län','Götaland'],[/\bgotland\b|\bvisby\b/i,'Gotlands län','Götaland'],
  [/\bblekinge\b|\bkarlskrona\b/i,'Blekinge län','Götaland'],[/\bskåne\b|\bmalmö\b|\bhelsingborg\b|\blund\b/i,'Skåne län','Götaland'],
  [/\bhalland\b|\bhalmstad\b/i,'Hallands län','Götaland'],[/\bvästra götaland\b|\bgöteborg\b|\bborås\b/i,'Västra Götalands län','Götaland'],
  [/\bgävleborg\b|\bgävle\b/i,'Gävleborgs län','Norrland'],[/\bvästernorrland\b|\bsundsvall\b/i,'Västernorrlands län','Norrland'],
  [/\bjämtland\b|\böstersund\b/i,'Jämtlands län','Norrland'],[/\bvästerbotten\b|\bumeå\b/i,'Västerbottens län','Norrland'],
  [/\bnorrbotten\b|\bluleå\b|\bkiruna\b/i,'Norrbottens län','Norrland']
];

function ageDays(value:string, now:Date){const t=new Date(value).getTime();return Number.isNaN(t)?9999:(now.getTime()-t)/86400000;}
function uniq<T>(x:T[]){return [...new Set(x)];}
function actor(text:string){return competitors.find(c=>text.toLocaleLowerCase('sv-SE').includes(c.toLocaleLowerCase('sv-SE')))??null;}

export function normalizeGeography(item: GeographicEvent){
  const explicit=item.geographies.map(x=>x.trim()).filter(Boolean);
  const hay=`${explicit.join(' ')} ${item.title} ${item.factualSummary??''}`;
  const explicitMunicipality=findMunicipalityByExplicitGeography(explicit);
  const textMunicipality=findMunicipalityInText(`${item.title} ${item.factualSummary??''}`);
  const municipality=explicitMunicipality??textMunicipality;
  if(municipality){
    const region=countyRegion[municipality.county.toLocaleLowerCase('sv-SE')]??'Okänd';
    return {municipality:municipality.name,county:municipality.county,marketRegion:region,geographyLabel:municipality.name,confidence:(explicitMunicipality?'Hög':'Medel') as GeographyConfidence};
  }
  for(const g of explicit){
    const exact=countyRegion[g.toLocaleLowerCase('sv-SE')];
    if(exact) return {municipality:null,county:g,marketRegion:exact,geographyLabel:g,confidence:'Hög' as GeographyConfidence};
  }
  for(const [pattern,county,region] of aliases){
    const match=hay.match(pattern);
    if(match) return {municipality:null,county,marketRegion:region,geographyLabel:explicit[0]??match[0],confidence:(explicit.length?'Hög':'Medel') as GeographyConfidence};
  }
  if(explicit.length) return {municipality:null,county:null,marketRegion:'Okänd' as MarketRegion,geographyLabel:explicit[0],confidence:'Medel' as GeographyConfidence};
  return {municipality:null,county:null,marketRegion:'Okänd' as MarketRegion,geographyLabel:'Geografi saknas',confidence:'Låg' as GeographyConfidence};
}

export function buildGeographicSignals(items:GeographicEvent[]):GeographicSignal[]{
  return items.flatMap(event=>{
    const signal=classifyLocalSignal(event);
    if(!signal)return [];
    const geo=normalizeGeography(event);
    return [{event,signalType:signal.type,strength:signal.strength,municipality:geo.municipality,county:geo.county,marketRegion:geo.marketRegion,geographyLabel:geo.geographyLabel,geographyConfidence:geo.confidence,actor:actor(`${event.title} ${event.factualSummary??''}`)}];
  });
}

export function buildLocalMarketRadar(items:GeographicEvent[],now=new Date()){
  const signals=buildGeographicSignals(items);
  const current=signals.filter(x=>ageDays(x.event.publishedAt,now)<=30);
  const previous=signals.filter(x=>{const d=ageDays(x.event.publishedAt,now);return d>30&&d<=60;});
  const keys=uniq(current.map(x=>x.county??x.marketRegion).filter(x=>x!=='Okänd'));
  const changes:GeographicChange[]=keys.map(label=>{
    const cur=current.filter(x=>(x.county??x.marketRegion)===label);
    const prev=previous.filter(x=>(x.county??x.marketRegion)===label);
    const domains=uniq(cur.map(x=>{try{return new URL(x.event.url).hostname.replace(/^www\./,'')}catch{return x.event.source}}));
    const confidence:GeographyConfidence=cur.length>=3&&domains.length>=2?'Hög':cur.length>=2?'Medel':'Låg';
    const delta=cur.length-prev.length;
    const direction=delta>=2?'högre':delta<=-2?'lägre':'ungefär oförändrad';
    return {
      level:(label.endsWith(' län')?'län':'region') as 'län'|'region',
      label,current30:cur.length,previous30:prev.length,delta,
      signalTypes:uniq(cur.map(x=>x.signalType)),actors:uniq(cur.map(x=>x.actor).filter((x):x is string=>Boolean(x))),
      evidence:cur.slice(0,6),confidence,
      assessment:`Observerad lokal signalaktivitet är ${direction} än föregående 30 dagar. Detta beskriver aktivitet i källunderlaget – inte en bekräftad strategi.`
    };
  }).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||b.current30-a.current30);
  return {signals,current30:current.length,previous30:previous.length,changes:changes.slice(0,6)};
}


export function buildMunicipalityRadar(items:GeographicEvent[],now=new Date()){
  const signals=buildGeographicSignals(items).filter(x=>x.municipality);
  const current=signals.filter(x=>ageDays(x.event.publishedAt,now)<=30);
  const previous=signals.filter(x=>{const d=ageDays(x.event.publishedAt,now);return d>30&&d<=60;});
  const keys=uniq(current.map(x=>x.municipality).filter((x):x is string=>Boolean(x)));
  const changes:GeographicChange[]=keys.map(label=>{
    const cur=current.filter(x=>x.municipality===label);
    const prev=previous.filter(x=>x.municipality===label);
    const domains=uniq(cur.map(x=>{try{return new URL(x.event.url).hostname.replace(/^www\./,'')}catch{return x.event.source}}));
    const confidence:GeographyConfidence=cur.length>=3&&domains.length>=2?'Hög':cur.length>=2?'Medel':'Låg';
    const delta=cur.length-prev.length;
    const direction=delta>=2?'tydligt högre':delta===1?'något högre':delta<=-2?'tydligt lägre':delta===-1?'något lägre':'oförändrad';
    return {
      level:'kommun' as const,label,current30:cur.length,previous30:prev.length,delta,
      signalTypes:uniq(cur.map(x=>x.signalType)),actors:uniq(cur.map(x=>x.actor).filter((x):x is string=>Boolean(x))),
      evidence:cur.slice(0,8),confidence,
      assessment:`Kommunal signalaktivitet är ${direction} än föregående 30 dagar. Bevakly beskriver observerade händelser och drar inte slutsatsen att kommunen eller en aktör har ändrat strategi utan separat stöd.`
    };
  }).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||b.current30-a.current30);
  return {signals,current30:current.length,previous30:previous.length,changes:changes.slice(0,8)};
}
