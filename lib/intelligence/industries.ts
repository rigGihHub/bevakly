import type { WatchSource } from './sources';
import { wasteSources } from './sources';

export type IndustryId = 'waste'|'energy'|'transport'|'construction'|'property'|'manufacturing'|'healthcare'|'retail'|'technology'|'finance'|'custom';
export type IndustryProfile = {
  id: IndustryId; label: string; description: string; keywords: string[]; themes: string[]; sources: WatchSource[]; suggestedCompetitors: string[];
};

const generalSources: WatchSource[] = [
  { id:'regeringen-press', name:'Regeringen', listingUrl:'https://www.regeringen.se/pressmeddelanden/', baseUrl:'https://www.regeringen.se', type:'authority', scope:'sweden', tier:1, trustScore:100, enabled:true },
  { id:'riksdagen-documents', name:'Sveriges riksdag', listingUrl:'https://www.riksdagen.se/sv/dokument-och-lagar/', baseUrl:'https://www.riksdagen.se', type:'authority', scope:'sweden', tier:1, trustScore:100, enabled:true },
  { id:'eu-general-environment', name:'EU-kommissionen – Environment', listingUrl:'https://environment.ec.europa.eu/news_en', baseUrl:'https://environment.ec.europa.eu', type:'eu', scope:'eu', tier:1, trustScore:100, enabled:true },
];
const energySources: WatchSource[] = [...generalSources,
  { id:'energimyndigheten', name:'Energimyndigheten', listingUrl:'https://www.energimyndigheten.se/nyhetsarkiv/', baseUrl:'https://www.energimyndigheten.se', type:'authority', scope:'sweden', tier:1, trustScore:100, enabled:true },
];
const constructionSources: WatchSource[] = [...generalSources,
  { id:'boverket', name:'Boverket', listingUrl:'https://www.boverket.se/sv/om-boverket/publicerat-av-boverket/nyheter/', baseUrl:'https://www.boverket.se', type:'authority', scope:'sweden', tier:1, trustScore:100, enabled:true },
];
const technologySources: WatchSource[] = [...generalSources,
  { id:'vinnova', name:'Vinnova', listingUrl:'https://www.vinnova.se/m/nyheter/', baseUrl:'https://www.vinnova.se', type:'authority', scope:'sweden', tier:1, trustScore:95, enabled:true },
];

export const industryProfiles: IndustryProfile[] = [
  {id:'waste',label:'Avfall & återvinning',description:'Avfall, återvinning, cirkularitet och resurshantering.',keywords:['avfall','återvinn','insamling','sortering','återbruk','depon','förpack','producentansvar','biogas','textil','plast','batteri','cirkul','slam','farligt avfall','materialåtervin','waste','recycling','circular economy','packaging','incineration','landfill','secondary raw material'],themes:['Regelverk','Konkurrenter','Teknik & innovation','Investeringar','Cirkularitet','Kapacitet','Kostnad & marknad'],sources:wasteSources,suggestedCompetitors:['PreZero','Ragn-Sells','Stena Recycling','Ohlssons','Remondis','Verdis']},
  {id:'energy',label:'Energi',description:'El, kraft, energiomställning, nät, lagring och bränslen.',keywords:['energi','elmarknad','elnät','kraft','vindkraft','solkraft','kärnkraft','vätgas','energilagring','batterilager','fjärrvärme','bioenergi','elektrifier','energy','power grid','hydrogen'],themes:['Regelverk','Produktion','Elnät','Lagring','Investeringar','Teknik','Priser'],sources:energySources,suggestedCompetitors:[]},
  {id:'transport',label:'Transport & logistik',description:'Gods, väg, järnväg, logistik, mobilitet och fordonsomställning.',keywords:['transport','logistik','gods','lastbil','järnväg','hamn','sjöfart','fordon','mobilitet','laddinfrastruktur','drivmedel','trafik','freight','mobility'],themes:['Regelverk','Infrastruktur','Teknik','Fordon','Bränslen','Kostnader','Marknad'],sources:generalSources,suggestedCompetitors:[]},
  {id:'construction',label:'Bygg & anläggning',description:'Byggande, entreprenad, material, infrastruktur och fastighetsutveckling.',keywords:['bygg','anläggning','entreprenad','cement','betong','byggmaterial','infrastruktur','bygglov','bostadsbygg','renovering','construction'],themes:['Regelverk','Material','Investeringar','Teknik','Kostnader','Hållbarhet'],sources:constructionSources,suggestedCompetitors:[]},
  {id:'property',label:'Fastighet',description:'Fastighetsmarknad, drift, energi, investeringar och regelverk.',keywords:['fastighet','lokaler','hyres','bostad','fastighetsbolag','fastighetsmarknad','energieffektiv','vakans','förvaltning','property','real estate'],themes:['Marknad','Regelverk','Energi','Investeringar','Teknik','Transaktioner'],sources:generalSources,suggestedCompetitors:[]},
  {id:'manufacturing',label:'Industri & tillverkning',description:'Produktion, råvaror, automation, investeringar och industripolitik.',keywords:['industri','tillverkning','produktion','fabrik','automation','råvara','industrisatsning','produktionsanläggning','leveranskedja','manufacturing'],themes:['Investeringar','Teknik','Råvaror','Energi','Regelverk','Kapacitet'],sources:generalSources,suggestedCompetitors:[]},
  {id:'healthcare',label:'Vård & omsorg',description:'Vårdsystem, medicinteknik, kapacitet, regelverk och innovation.',keywords:['sjukvård','vård','omsorg','sjukhus','medicinteknik','läkemedel','patient','region','vårdplats','healthcare'],themes:['Regelverk','Kapacitet','Teknik','Läkemedel','Organisation','Investeringar'],sources:generalSources,suggestedCompetitors:[]},
  {id:'retail',label:'Handel & retail',description:'Konsumentmarknad, e-handel, logistik, priser och butiksteknik.',keywords:['handel','butik','e-handel','retail','konsument','dagligvar','livsmedel','butikskedja','försäljning'],themes:['Konsument','Priser','E-handel','Teknik','Logistik','Regelverk'],sources:generalSources,suggestedCompetitors:[]},
  {id:'technology',label:'Tech & digitalisering',description:'AI, mjukvara, cybersäkerhet, data och digital infrastruktur.',keywords:['artificiell intelligens',' ai ','mjukvara','cybersäker','digitalisering','data','molntjänst','chip','halvledare','it-säkerhet','artificial intelligence','cybersecurity'],themes:['AI','Cybersäkerhet','Regelverk','Investeringar','Produktlanseringar','Infrastruktur'],sources:technologySources,suggestedCompetitors:[]},
  {id:'finance',label:'Finans & försäkring',description:'Bank, finans, försäkring, betalningar och finansiell reglering.',keywords:['bank','finans','försäkring','betalning','ränta','kredit','fintech','kapitalkrav','bolån','finance','insurance'],themes:['Regelverk','Räntor','Kredit','Fintech','Marknad','Risk'],sources:generalSources,suggestedCompetitors:[]},
  {id:'custom',label:'Annan bransch',description:'Ange en egen bransch. Bevakly använder svenska och europeiska myndighetskällor som startpunkt.',keywords:[],themes:['Regelverk','Konkurrenter','Teknik & innovation','Investeringar','Marknad'],sources:generalSources,suggestedCompetitors:[]},
];

export function getIndustryProfile(id:string, customIndustry=''): IndustryProfile {
  const base=industryProfiles.find(x=>x.id===id) ?? industryProfiles[0];
  if(base.id!=='custom') return base;
  const words=customIndustry.toLocaleLowerCase('sv-SE').split(/[^a-zåäö0-9]+/).filter(x=>x.length>2);
  return {...base,label:customIndustry.trim()||'Annan bransch',keywords:words};
}
