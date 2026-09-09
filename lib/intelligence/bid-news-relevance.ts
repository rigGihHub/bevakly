import { assessEarlySignalEscalation } from './early-signal-escalation.ts';
export type BidNewsRelevanceTier='A'|'B'|'C'|'D';

export type BidNewsRelevance={
  escalation?:ReturnType<typeof assessEarlySignalEscalation>;
  tier:BidNewsRelevanceTier;
  score:number;
  label:'Direkt affärskritisk'|'Strategiskt viktig'|'Relevant omvärld'|'Perifer';
  themes:string[];
  reasons:string[];
  adjustment:number;
  guardrail:string;
};

const THEMES:Array<{id:string;label:string;weight:number;patterns:RegExp[]}>= [
  {id:'contract',label:'Kontrakt/tilldelning',weight:34,patterns:[/\btilldel(?:ning|ar|as|ades|at)\b/i,/\b(?:nytt?|nya|tecknat|tecknar|tecknade|vunnit|vinner|får|fick|fortsatt)\s+(?:[a-zåäö-]+\s+){0,3}(?:avtal|kontrakt|uppdrag)\b/i,/\buppdrag(?:et|en)?\s+(?:omfattar|avser|startar|löper)\b/i,/\b(?:tar|tog) över\b/i,/\bpå uppdrag av\b/i,/\bansvarar\b[^.]{0,65}\binsamling\b/i,/\bupphandling\b.*\b(?:tilldel|vann|vunnit|avtal|uppdrag)\b/i]},
  {id:'capacity',label:'Anläggning/kapacitet',weight:28,patterns:[/\b(?:ny|nya|bygger|byggt|byggd|öppnar|öppnade|inviger|invigde|invigs|etablerar|etablerade)\s+(?:[a-zåäö-]+\s+){0,3}[a-zåäö-]*anläggning(?:en|ar|arna)?\b/i,/\b[a-zåäö-]*anläggning(?:en|ar|arna)?\b[^.]{0,45}\b(?:invigs|inviger|öppnar|öppnade|byggs|etableras|driftsätts)\b/i,/\bkapacitet(?:en|er|erna)?\b/i,/behandlingskapacitet/i,/\butbygg/i,/\bdriftsätt/i,/\bny\s+terminal\b/i]},
  {id:'permit',label:'Tillstånd/reglering',weight:27,patterns:[/\bmiljötillstånd\b/i,/\btillstånd\b/i,/\bsamråd\b/i,/\bmiljöpröv/i,/\böverklag/i,/\bdomstol\b/i,/\bföreskrift\b/i,/\bproducentansvar\b/i,/\bförordning(?:en)?\b/i,/\b(?:avfalls)?lagstiftning(?:en)?\b/i,/\bregelverk(?:et)?\b/i,/\bregler(?:na)?\b/i,/\bnya?\s+(?:avfalls)?regler\b/i,/\bregeländring/i]},
  {id:'establishment',label:'Etablering/mark',weight:25,patterns:[/\betabler/i,/\bmarkköp\b/i,/\bdetaljplan\b/i,/\bbygglov\b/i,/\bny lokal\b/i,/\bnytt område\b/i]},
  {id:'ma',label:'Förvärv/M&A',weight:24,patterns:[/\bförvärv/i,/\bfusion\b/i,/\bköper\b/i,/\buppköp\b/i,/\bägarskifte\b/i]},
  {id:'investment',label:'Investering',weight:22,patterns:[/\binvester/i,/\bsatsning\b/i,/\bmiljon(?:er)?\b/i,/\bmiljard(?:er)?\b/i]},
  {id:'pricing',label:'Pris/kostnad/materialflöde',weight:42,patterns:[/\bpris(?:er|et|bild|justering|justeringar)?\b/i,/\bprisjuster/i,/\b(?:ökade|högre|stigande|sänkta|lägre)\s+kostnad(?:er)?\b/i,/\bkostnads(?:ökning|förändring|justering)/i,/\bgate fee\b/i,/\bbehandlings(?:avgift|pris)(?:er|en|erna)?\b/i,/\bmaterialersättning(?:ar|en)?\b/i,/\bmaterialflöde(?:n|na)?\b/i]},
  {id:'competitor',label:'Konkurrentförflyttning',weight:18,patterns:[/\bexpander/i,/\bväxer\b/i,/\bstärker\s+(?:sin\s+)?närvaro\b/i,/\bsamarbet/i,/\bpartnerskap\b/i,/\bmarknadsandel\b/i,/\bny marknad\b/i]},
  {id:'leadership',label:'Ledning/organisation',weight:10,patterns:[/\bny vd\b/i,/\bvd\b.*\bavgår\b/i,/\butser\b.*\bchef\b/i,/\bomorganisation\b/i]},
  {id:'technology',label:'Teknik/pilot',weight:8,patterns:[/\bpilot\b/i,/\binnovation\b/i,/\bteknik\b/i,/\bai\b/i,/\bautomation\b/i]},
  {id:'generic-esg',label:'Allmän hållbarhet',weight:3,patterns:[/\bhållbarhet\b/i,/\bklimat\b/i,/\bcirkulär ekonomi\b/i,/\bfossilfri\b/i]},
];

const REFERENCE_OR_OPINION_TITLE=[/\bmall\b/i,/\bguide\b/i,/\bvägledning\b/i,/\bså (?:sorterar|återvinns|fungerar)\b/i,/\breformagenda\b/i,/\bdebatt\b/i,/\bkrönika\b/i,/\butbildning\b/i,/\bkurs\b/i,/\bwebbinarium\b/i,/\bkonferens\b/i,/\bseminarium\b/i,/\bvanliga frågor\b/i,/\bfaq\b/i,/\bordlista\b/i,/\bscenario\b/i,/\bforskning\b/i,/\bstudie\b/i,/\bprisindex\b/i,/\bstatistik\b/i,/\bkarta över\b/i,/\bkundcase\b/i,/\bså byggdes\b/i];
const PERIPHERAL=[
  /\bsponsr/i,/\bevent\b/i,/\bmässa\b/i,/\bwebbinarium\b/i,/\bkonferens\b/i,/\bseminarium\b/i,/\bpris(?:et)?\s+(?:för|till)\b/i,/\butmärkelse\b/i,
  /\bmedarbetar(?:e|porträtt)\b/i,/\bvi firar\b/i,/\bjubileum\b/i,/\bskolbesök\b/i,
];

function matched(text:string,patterns:RegExp[]){return patterns.some(rx=>rx.test(text));}


const EARLY_SIGNAL_PATTERNS:Array<{label:string;weight:number;patterns:RegExp[]}>= [
 {label:'Mark/planering före etablering',weight:34,patterns:[/\bmarkanvisning\b/i,/\b(?:positivt?\s+)?planbesked\b/i,/\bdetaljplan(?:en|earbetet)?\b[^.!?]{0,80}\b(?:antas|antagen|går vidare|möjliggör|medger)\b/i,/\b(?:säljer|köper|förvärvar)\b[^.!?]{0,70}\b(?:industrifastighet|verksamhetsmark|mark)\b/i,/\bbygglov\b[^.!?]{0,70}\b(?:bevilj|godkänn)/i]},
 {label:'Tillståndsprocess i rörelse',weight:34,patterns:[/\bsamråd\b[^.!?]{0,80}\b(?:planerad|inför|inleds|startar|påbörjas)\b/i,/\b(?:komplettering|kompletteringar)\s+begärs\b/i,/\bansökan\b[^.!?]{0,120}\b(?:ändrade villkor|högre årlig mängd|utökad|utöka)\b/i,/\bändrade villkor\b[^.!?]{0,100}\b(?:mängd|avfall|anläggning)\b/i,/\b(?:undanröjer|återförvisar)\b[^.!?]{0,120}\b(?:tillstånd|miljötillstånd|ärendet|beslutet)\b/i,/\b(?:tillstånd|miljötillstånd)\b[^.!?]{0,120}\b(?:undanröjer|återförvisar|ny prövning)\b/i]},
 {label:'Kommande upphandling',weight:36,patterns:[/\b(?:förbereder|ta fram)\b[^.!?]{0,80}\bupphandlingsunderlag\b/i,/\bavtal(?:et)?\b[^.!?]{0,60}\b(?:löper ut|upphör)\b[^.!?]{0,100}\b(?:upphandling|konkurrensutsättning)\b/i,/\b(?:upphandling|konkurrensutsättning)\b[^.!?]{0,90}\b(?:ska|planeras|startas|genomföras)\b/i,/\b(?:genomföra|genomför)\b[^.!?]{0,50}\bupphandling\b/i,/\bupphandling\b[^.!?]{0,45}\bavbryts\b/i,/\bavbryter\b[^.!?]{0,60}\bupphandling(?:en)?\b/i,/\b(?:överprövning|överprövas|ansöker om överprövning)\b[^.!?]{0,90}\bupphandling\b|\bupphandling\b[^.!?]{0,90}\b(?:överprövning|överprövas)\b/i]},
 {label:'Operativ kapacitetsförändring',weight:32,patterns:[/\b(?:tvåskift|treskift)\b/i,/\b(?:reducerad|begränsad|ökad|utökad)\s+kapacitet\b/i,/\b(?:mottagning|omlastning)\b[^.!?]{0,65}\b(?:flyttas|upphör|öppnar|startar)\b/i,/\b(?:balpress|sorteringslinje|kross|våg)\b[^.!?]{0,75}\b(?:installeras|byggs|tas i drift)\b/i,/\b(?:lagringsmängd|lagringsmängder)\b[^.!?]{0,80}\b(?:utökas|ökar|godkänner|godkänns|större)\b/i,/\b(?:godkänner|godkänns)\b[^.!?]{0,80}\b(?:större|utökade?)\s+lagringsmängder\b/i]},
 {label:'Rekrytering som uppstartssignal',weight:30,patterns:[/\b(?:söker|rekryterar)\b[^.!?]{0,90}\b(?:driftchef|operatörer|arbetsledare)\b[^.!?]{0,120}\b(?:ny verksamhet|uppstart|ny enhet|tas i drift)\b/i,/\b(?:ny verksamhet|uppstart|ny enhet)\b[^.!?]{0,120}\b(?:söker|rekryterar)\b/i]},
 {label:'Pris-/villkorsförändring',weight:34,patterns:[/\b(?:behandlingsavgift|materialersättning|avgiftsmodell)\b[^.!?]{0,80}\b(?:justeras|höjs|sänks|ändras|inför)\b/i,/\b(?:höjer|sänker|ändrar|inför)\b[^.!?]{0,70}\b(?:materialersättning|avgift|avgiftsmodell|mottagningsvillkor)\b/i]},
 {label:'Ägar-/strukturförändring',weight:30,patterns:[/\baktieöverlåtelse\b/i,/\bverklig huvudman\b[^.!?]{0,90}\b(?:ny|ändr|övertag)/i,/\b(?:ägarförändring|ny styrelse)\b/i,/\b(?:gemensamt bolag|joint venture)\b[^.!?]{0,80}\b(?:bildas|startas)\b/i]},
 {label:'Konkurrentens operativa förflyttning',weight:28,patterns:[/\b(?:ny|gemensam)\s+hubb\b/i,/\b(?:samlar|styr om)\b[^.!?]{0,140}\b(?:transporter|avfall|material)\b[^.!?]{0,140}\b(?:terminal|anläggning|hubb)\b/i,/\btransporter\b[^.!?]{0,120}\b(?:gemensam|hubb|terminal)\b/i,/\bbeställer\b[^.!?]{0,55}\b(?:insamlingsfordon|sopbilar|fordon)\b/i,/\b(?:lagrådsremiss|proposition)\b[^.!?]{0,90}\b(?:avfall|insamling|regler|krav)\b/i,/\b(?:flyttar|hyr|tecknar hyresavtal)\b[^.!?]{0,100}\b(?:återvinn\w*|sortering|avfall|omlastning)\b/i,/\bhyresavtal\b[^.!?]{0,80}återvinningsbolag/i]},
];
function earlySignalHits(text:string){return EARLY_SIGNAL_PATTERNS.filter(s=>s.patterns.some(rx=>rx.test(text)));}

const NEGATED_THEME:Record<string,RegExp[]>={
  contract:[/\butan[^.]{0,55}\b(?:upphandling|avtal|kontrakt|uppdrag)\b/i,/\b(?:ingen|inget|inga)\s+(?:ny\s+)?(?:upphandling|avtal|kontrakt)\b/i,/\binte[^.]{0,30}\b(?:upphandling|avtal|kontrakt)\b/i],
  investment:[/\butan[^.]{0,55}\binvester/i,/\b(?:ingen|inget|inga)\s+(?:ny\s+)?investering/i,/\binte[^.]{0,30}\binvester/i],
  capacity:[/\butan[^.]{0,70}\b(?:kapacitetsförändring|utbyggnad|ny anläggning)\b/i,/\bingen\s+(?:större\s+)?kapacitetsförändring\b/i],
  permit:[/\butan[^.]{0,55}\b(?:tillstånd|miljöprövning|samråd|regler|regelverk|lagstiftning)\b/i],
  ma:[/\butan[^.]{0,55}\b(?:förvärv|fusion|uppköp)\b/i],
  pricing:[/\b(?:ingen|inget|inga)\s+(?:faktisk\s+)?(?:prisjustering|prisförändring|kostnadsförändring)\b/i,/\butan[^.]{0,55}\b(?:prisjustering|prisförändring|kostnadsförändring)\b/i,/\binte[^.]{0,35}\b(?:prisjuster|prisförändr|kostnadsförändr)/i],
};
function negated(text:string,id:string){
 const specific=(NEGATED_THEME[id]??[]).some(rx=>rx.test(text));
 const terms:Record<string,string>={contract:'upphandling|avtal|kontrakt|uppdrag',investment:'investering|invester',capacity:'kapacitet|anläggning|utbyggnad',permit:'tillstånd|miljöprövning|samråd|regel|lagstiftning|förordning',ma:'förvärv|fusion|uppköp|köp',establishment:'etablering|bygglov|detaljplan|markköp',pricing:'prisjustering|prisförändring|kostnadsförändring'};
 const t=terms[id];
 const sentenceNeg=t?new RegExp(`\\b(?:ingen|inget|inga|utan)\\b[^.!?]{0,90}\\b(?:${t})`,`i`).test(text):false;
 return specific||sentenceNeg;
}

export function assessBidNewsRelevance(input:{
 title:string;
 text:string;
 competitors:string[];
 geographies:string[];
 sourceType:string;
}):BidNewsRelevance{
 const all=`${input.title} ${input.text}`;
 const earlySignals=earlySignalHits(all);
 const escalation=assessEarlySignalEscalation({title:input.title,text:input.text});
 const hits=THEMES.filter(t=>matched(all,t.patterns)&&!negated(all,t.id));
 const explicitGlobalNegations={
   contract:/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:upphandling|avtal|kontrakt|uppdrag|tilldelning)/i,
   capacity:/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:ny[^.!?]{0,30}anläggning|kapacitetsförändring|utbyggnad)/i,
   permit:/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:nytt?[^.!?]{0,20}tillstånd|aktuell[^.!?]{0,20}prövning|regeländring|ansökan)/i,
   investment:/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:investering|investeringsbeslut)/i,
   ma:/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:förvärv|fusion|uppköp)/i,
 } as const;
 const filteredHits=hits.filter(h=>!(h.id in explicitGlobalNegations && explicitGlobalNegations[h.id as keyof typeof explicitGlobalNegations].test(all)));

 const themes=filteredHits.map(x=>x.label);
 const reasons:string[]=[];
 let score=filteredHits.reduce((sum,x)=>sum+x.weight,0);
 score=Math.min(80,score);
 if(earlySignals.length){score+=Math.min(42,earlySignals.reduce((sum,x)=>sum+x.weight,0));reasons.push(`Tidig förändringssignal: ${earlySignals.map(x=>x.label).join(', ')}.`);}

 const titleHits=THEMES.filter(t=>matched(input.title,t.patterns)&&!negated(input.title,t.id));
 if(titleHits.length){score+=Math.min(18,titleHits.length*9);reasons.push(`Affärstema finns i rubriken: ${titleHits.map(x=>x.label).join(', ')}.`);}
 if(input.competitors.length){score+=8;reasons.push(`Namngiven bevakad aktör: ${input.competitors.join(', ')}.`);}
 if(input.geographies.length){score+=4;reasons.push(`Geografisk marknad kan identifieras: ${input.geographies.join(', ')}.`);}
 if(input.sourceType==='procurement'){score+=10;reasons.push('Upphandlingskälla ger direkt marknadsrelevans.');}
 const directContract=filteredHits.some(x=>x.id==='contract')&&(/\b(tilldel(?:ning|ar|as)|(?:nytt?|tecknat|tecknar|vunnit|vinner|får|fick|fortsatt)\s+(?:[a-zåäö-]+\s+){0,3}(?:avtal|kontrakt|uppdrag)|tar över|på uppdrag av|ansvarar[^.]{0,65}insamling)\b/i.test(all));
 if(directContract){score+=20;reasons.push('Direkt kontrakts-/tilldelningssignal får extra arbetsvärde.');}
 const capacityInvestment=filteredHits.some(x=>x.id==='capacity')&&filteredHits.some(x=>x.id==='investment');
 if(capacityInvestment){score+=12;reasons.push('Kapacitetsförändring kombinerad med investering får extra arbetsvärde.');}
 const directRegulation=filteredHits.some(x=>x.id==='permit')&&/(?:börjar\s+(?:gälla|tillämpas)|träder\s+i\s+kraft|från och med|från\s+\d{1,2}\s+[a-zåäö]+\s+20\d{2}[^.!?]{0,35}ändras|regler(?:na)?\s+ändras|ändras\s+regler(?:na)?|nya regler|regeländring|bevilj\w*|ansök\w*[^.!?]{0,45}miljötillstånd|miljötillstånd[^.!?]{0,45}(?:bevilj|beslut|ansök)|samråd[^.!?]{0,35}(?:inleds|startar|påbörjas)|upphäver|domstolen\s+(?:beslutar|avgör))/i.test(all);
 if(directRegulation){score+=16;reasons.push('Aktuell regel-/tillståndsförändring får extra arbetsvärde.');}
 const directPricing=filteredHits.some(x=>x.id==='pricing')&&/(?:prisjuster\w*|pris(?:et|erna?)?\s+(?:höjs|sänks|ändras|justeras)|höj\w*\s+(?:pris|avgift)|sänk\w*\s+(?:pris|avgift)|ökade kostnader|högre kostnader|behandlings(?:pris|avgift)\w*\s+(?:höjs|sänks|ändras|justeras))/i.test(all);
 if(directPricing){score+=14;reasons.push('Konkret pris-/kostnadsförändring får extra arbetsvärde.');}
 if(filteredHits.some(x=>x.id==='pricing')&&!directPricing&&!filteredHits.some(x=>['contract','capacity','permit','establishment','ma','investment'].includes(x.id))){score=Math.min(score,48);reasons.push('Pris-/kostnadsord utan konkret förändring hålls under strategisk nivå.');}
 const directCapacity=filteredHits.some(x=>x.id==='capacity')&&/\b(?:invigs|inviger|öppnar|byggs|bygger|driftsätt|ny anläggning|kapacitet)\b/i.test(all);
 if(directCapacity){score+=10;reasons.push('Konkret kapacitetsförändring får extra arbetsvärde.');}
 const quantifiedCapacity=filteredHits.some(x=>x.id==='capacity')&&/\b\d[\d .]*(?:ton|t|m3|m³)\b/i.test(all);
 if(quantifiedCapacity){score+=16;reasons.push('Kapacitetsförändringen är kvantifierad.');}
 const majorInvestment=filteredHits.some(x=>x.id==='investment')&&/(?:halv miljard|\b\d+[\d ,.]*\s*(?:miljoner|miljarder)\b)/i.test(all);
 if(majorInvestment){score+=16;reasons.push('Investeringen är materiellt kvantifierad.');}
 const directMA=filteredHits.some(x=>x.id==='ma')&&/(?:förvärv|köper|uppköp|fusion)/i.test(all);
 if(directMA){score+=18;reasons.push('Direkt förvärvs-/M&A-signal får extra arbetsvärde.');}
 const directEstablishment=filteredHits.some(x=>x.id==='establishment')&&/(?:detaljplan|bygglov|markköp|etabler)/i.test(all);
 if(directEstablishment){score+=12;reasons.push('Direkt etablerings-/marksignal får extra arbetsvärde.');}


 const nonEventLanguage=/(?:förklarar|går igenom|beskriver processen|generell(?:t|a)?|faktasida|ordlista|hjälpsida|informationssida|programtext|diskuterar|modellerar|potential|kan behöva|kan öka|överväger|önskar|vill se|borde|råd inför|historik om|arkiv|sökresultat|befintliga anläggningar)/i.test(all);
 const explicitNoDecision=/\b(?:ingen|inget|inga|inte|utan)\b[^.!?]{0,100}(?:nytt? |nya )?(?:beslut|affär|tilldelning|uppdrag|investering|kapacitetsförändring|regeländring|tillstånd|ansökan|prisjustering|marknadshändelse)/i.test(all);
 const jobAdContext=/\b(?:jobbannons|lediga jobb|söker (?:en |nu )?|projektledare|säljare)\b/i.test(all);
 const speculativeOrAdvocacy=/(?:\bvill se\b|\bönskar\b|\bborde\b|\bkan behöva\b|\bkan öka\b|\bmöjlig(?:t|a)?\b|\bpotential\b|\bspekulerar\b|\btror att\b|\bförespråkar\b)/i.test(all);
 if(nonEventLanguage&&!directContract&&!directRegulation&&!directPricing&&!directCapacity&&!directMA&&!directEstablishment){score-=24;reasons.push('Texten beskriver främst referens-, analys- eller scenariomaterial utan verifierad marknadshändelse.');}
 if(explicitNoDecision&&!directContract&&!directRegulation&&!directPricing&&!directMA){score-=22;reasons.push('Texten säger uttryckligen att konkret beslut/händelse saknas.');}
 if(jobAdContext&&!/\b(?:startar|bygger|byggstart|driftsätt|öppnar|etablerar)\b/i.test(all)){score-=42;reasons.push('Jobbannons utan separat verifierad etablerings-/kapacitetshändelse hålls nere.');}
 if(speculativeOrAdvocacy&&!directContract&&!directPricing&&!directCapacity&&!directMA&&!/\b(?:bevilj|beslutar|beslutade|träder i kraft|börjar gälla|antogs)\b/i.test(all)){score-=24;reasons.push('Önskemål, scenario eller spekulation behandlas inte som verifierad marknadshändelse.');}

 const referenceOrOpinion=REFERENCE_OR_OPINION_TITLE.some(rx=>rx.test(input.title));
 if(referenceOrOpinion){score-=28;reasons.push('Rubriken signalerar referensmaterial/opinion snarare än en verifierad marknadshändelse.');}
 const peripheral=PERIPHERAL.some(rx=>rx.test(input.title));
 if(peripheral){score-=25;reasons.push('Rubriken liknar kommunikation/event/utmärkelse snarare än marknadsförändring.');}

 // Generic sustainability/technology should not outrank commercial or regulatory changes by keyword volume alone.
 const directThemes=new Set(['contract','capacity','permit','establishment','ma','investment','pricing','competitor']);
 const direct=hits.some(x=>directThemes.has(x.id));
 if(referenceOrOpinion&&!directContract){score=Math.min(score,48);}
 if(!direct&&filteredHits.length){score=Math.min(score,48);reasons.push('Relevansen är främst indirekt; ingen tydlig kontrakts-, kapacitets-, tillstånds-, etablerings- eller affärsförändring hittades.');}
 if(!filteredHits.length&&!earlySignals.length){score=Math.min(score,20);reasons.push('Ingen tydlig Bid Manager-relevant förändring hittades.');}
 if(earlySignals.length&&!referenceOrOpinion&&!explicitNoDecision){score=Math.max(score,58);score+=escalation.bonus;score=Math.min(score,escalation.scoreCap);reasons.push(`Verifierbar förstadiesignal kalibreras som ${escalation.stage}; tidig signal får inte automatiskt samma tyngd som beslut/genomförande.`);}

 score=Math.max(0,Math.min(100,Math.round(score)));
 const tier:BidNewsRelevanceTier=score>=75?'A':score>=55?'B':score>=35?'C':'D';
 const label=tier==='A'?'Direkt affärskritisk':tier==='B'?'Strategiskt viktig':tier==='C'?'Relevant omvärld':'Perifer';
 const adjustment=tier==='A'?8:tier==='B'?4:tier==='C'?0:-12;

 return {
   tier,score,label,themes,reasons,adjustment,escalation,
   guardrail:'Relevansrankningen prioriterar nyheter för marknads- och anbudsarbete i avfallsbranschen. Den bedömer arbetsvärde, inte sannolikheten att en hypotes är sann.',
 };
}

export function summarizeBidNewsRelevance(items:BidNewsRelevance[]){
 return {
  assessed:items.length,
  tierA:items.filter(x=>x.tier==='A').length,
  tierB:items.filter(x=>x.tier==='B').length,
  tierC:items.filter(x=>x.tier==='C').length,
  tierD:items.filter(x=>x.tier==='D').length,
 };
}
