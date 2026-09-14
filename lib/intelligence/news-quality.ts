import type { ArticleExtraction, ArticleExtractionMethod } from './article';

export type NewsQualityDecision='accept'|'accept-thin'|'reject';
export type NewsQualityAssessment={
  decision:NewsQualityDecision;
  qualityScore:number;
  topicHits:number;
  titleTopicHits:number;
  strategicHits:number;
  bodyChars:number;
  reasons:string[];
};

const WASTE_TERMS=[
  'avfall','återvinn','återbruk','depon','insamling','sortering','materialåtervinning','energiåtervinning',
  'förpack','plast','textil','producentansvar','cirkulär','farligt avfall','slam','biogas','massor',
  'återvinningscentral','åvc','behandlingsanläggning','behandlingspris','behandlingsavgift','materialersättning','avfallsflöde'
];
const STRATEGIC_TERMS=[
  'invest','anläggning','kapacitet','etabler','förvärv','fusion','avtal','kontrakt','upphandling',
  'tillstånd','samråd','miljöpröv','bygglov','detaljplan','markköp','rekryter','öppnar','stänger','rfi','marknadsdialog','tilldelningsbeslut','överprövning','optionsår','avtalsstart','entreprenörsbyte',
  'utbygg','expansion','ny vd','vd ','konkurs','samarbete','partnerskap','prisjuster','regeländring','förordning','lagstiftning'
];
const MATERIAL_COMPETITOR_PATTERNS=[
  /\b(?:förvärvar|förvärv|köper|säljer)\b[^.!?]{0,100}\b(?:bolag|verksamhet|anläggning|fastighet|rörelse)\b/i,
  /\b(?:fusion|samgående|aktieöverlåtelse|ägarförändring|joint venture|gemensamt bolag)\b/i,
  /\b(?:investerar|investering|miljoninvestering|miljardinvestering)\b/i,
  /\b(?:ny|tillträder som|utses till)\s+(?:vd|ceo|koncernchef|affärsområdeschef)\b/i,
  /\b(?:vd|ceo|koncernchef)\b[^.!?]{0,70}\b(?:slutar|avgår|lämnar|tillträder|utses)\b/i,
  /\b(?:konkurs|rekonstruktion|likvidation)\b/i,
  /\b(?:öppnar|stänger|etablerar|etablering|expanderar|expansion|utbyggnad)\b[^.!?]{0,110}\b(?:anläggning|verksamhet|site|terminal|depå|kontor|region|marknad)?\b/i,
  /\b(?:kapacitet|produktion|mottagning|omlastning)\b[^.!?]{0,90}\b(?:ökar|utökas|minskar|begränsas|flyttas|upphör)\b/i,
  /\b(?:tecknar|vinner|tilldelas|förlorar)\b[^.!?]{0,100}\b(?:avtal|kontrakt|upphandling|ramavtal)\b/i,
  /\b(?:avtal|kontrakt|upphandling|ramavtal)\b[^.!?]{0,100}\b(?:tecknas|vinns|tilldelas|förlängs|upphör|överprövas)\b/i,
  /\b(?:tillstånd|miljötillstånd|bygglov|detaljplan|samråd|miljöprövning)\b[^.!?]{0,100}\b(?:beviljas|avslås|ansöks|söks|ändras|överklagas|inleds|godkänns)?\b/i,
  /\b(?:prisjustering|prisökning|prissänkning|avgiftshöjning|avgiftssänkning)\b/i,
  /\b(?:regeländring|förordning|lagstiftning)\b[^.!?]{0,100}\b(?:påverkar|träder i kraft|ändras|skärps|lättas)\b/i,
];
const EARLY_EVENT_PATTERNS=[
 /\bmarkanvisning\b/i,/\b(?:säljer|köper)\b[^.!?]{0,80}\b(?:industrifastighet|verksamhetsmark|mark)\b/i,/\bplanbesked\b/i,/\baktieöverlåtelse\b/i,/\bägarförändring\b/i,/\blagringsmängder?\b[^.!?]{0,80}\b(?:utökas|större|godkänn)/i,/\bdetaljplan(?:en|earbetet)?\b[^.!?]{0,80}\b(?:antas|går vidare|möjliggör|medger)\b/i,
 /\bbygglov\b[^.!?]{0,70}\bbevilj/i,/\bsamråd\b[^.!?]{0,80}\b(?:inför|planerad|inleds|startar)\b/i,/\bkompletteringar?\s+begärs\b/i,
 /\bupphandlingsunderlag\b/i,/\b(?:rfi|marknadsdialog|upphandlingsplan|planerad upphandling)\b/i,/\b(?:tilldelningsbeslut|avtalsstart|entreprenörsbyte|optionsår)\b/i,/\bavtal(?:et)?\b[^.!?]{0,60}\b(?:löper ut|upphör)\b/i,/\bupphandling\b[^.!?]{0,90}\b(?:avbryts|överpröv)/i,/\b(?:avbryter|överprövar|ansöker om överprövning)\b[^.!?]{0,90}\bupphandling(?:en)?\b/i,/\bupphandlingsunderlag\b/i,
 /\b(?:tvåskift|treskift|reducerad kapacitet|begränsad kapacitet)\b/i,/\b(?:mottagning|omlastning)\b[^.!?]{0,65}\b(?:flyttas|upphör)\b/i,
 /\b(?:behandlingsavgift|materialersättning|avgiftsmodell)\b[^.!?]{0,100}\b(?:justeras|höjs|sänks|ändras|inför)\b/i,/\b(?:höjer|sänker|ändrar|inför)\b[^.!?]{0,80}\b(?:materialersättning|avgift|avgiftsmodell)\b/i,
 /\baktieöverlåtelse\b/i,/\bägarförändring\b/i,/\bgemensamt bolag\b[^.!?]{0,80}\bbildas\b/i,/\b(?:ny verksamhet|uppstart|ny enhet)\b[^.!?]{0,120}\b(?:söker|rekryterar)\b/i,/\b(?:lagrådsremiss|proposition)\b[^.!?]{0,90}\b(?:avfall|insamling|krav|regler)\b/i,/\b(?:undanröjer|återförvisar)\b[^.!?]{0,120}\b(?:miljötillstånd|tillstånd|beslut)\b/i,/\b(?:tecknar hyresavtal|hyr)\b[^.!?]{0,120}\b(?:återvinn\w*|sortering|avfall)\b/i,
];
const NOISE_TITLE=[
  /lediga jobb/i,/cookie/i,/integritetspolicy/i,/kontakta oss/i,/kundservice/i,/öppettider/i,
  /sorteringsguide/i,/så sorterar du/i,/återvinningskalender/i,/driftinformation/i,/prislista/i
];

function countHits(text:string,terms:string[]){
 const lower=text.toLocaleLowerCase('sv-SE');
 return terms.filter(t=>lower.includes(t)).length;
}
function methodQuality(method:ArticleExtractionMethod){
 return method==='json-ld'||method==='article'?20:
  method==='main'?17:method==='paragraphs-keyword'?15:
  method==='paragraphs-fallback'?7:method==='metadata'?5:0;
}

export function assessNewsQuality(input:{
 title:string;
 article:ArticleExtraction;
 sourceType:string;
 geographies:string[];
 competitors:string[];
}):NewsQualityAssessment{
 const title=(input.article.title||input.title).trim();
 const body=input.article.textSample||input.article.description||'';
 const all=`${title} ${input.article.description} ${body}`;
 const titleTopicHits=countHits(title,WASTE_TERMS);
 const topicHits=countHits(all,WASTE_TERMS);
 const strategicHits=countHits(all,STRATEGIC_TERMS);
 const earlyEvent=EARLY_EVENT_PATTERNS.some(rx=>rx.test(all));
 const materialCompetitorEvent=MATERIAL_COMPETITOR_PATTERNS.some(rx=>rx.test(all));
 const directCompetitorContext=input.sourceType==='competitor'||input.sourceType==='company'||input.competitors.length>0;
 const competitorStrategicEvent=directCompetitorContext&&materialCompetitorEvent;
 const reasons:string[]=[];
 let score=0;

 score+=Math.min(30,topicHits*7);
 score+=Math.min(18,titleTopicHits*9);
 score+=Math.min(18,strategicHits*6);
 if(earlyEvent&&topicHits>0)score=Math.max(score+18,46);
 score+=methodQuality(input.article.extractionMethod);
 score+=Math.min(8,input.geographies.length*4);
 score+=Math.min(8,input.competitors.length*4);

 if(body.length>=450)score+=8;
 else if(body.length>=180)score+=4;
 else reasons.push('Tunt artikelunderlag.');

 if(NOISE_TITLE.some(rx=>rx.test(title))){score-=30;reasons.push('Titeln liknar service-/navigationsinnehåll snarare än en nyhet.');}
 if(topicHits===0){
   if(competitorStrategicEvent){
     score=Math.max(score+18,44);
     reasons.push('Materiell konkurrenthändelse utan generiskt branschord; behåll med försiktig vikt.');
   } else {
     score-=35;
     if(directCompetitorContext&&strategicHits>0)reasons.push('Konkurrent nämns, men händelsen är inte tillräckligt materiell för att kringgå ämneskravet.');
     else reasons.push('Ingen tydlig avfalls-/återvinningskoppling i hämtat underlag.');
   }
 }
 if(titleTopicHits===0&&strategicHits===0&&input.competitors.length===0){score-=18;reasons.push('Svag nyhetssignal: varken ämne i titel, strategisk förändring eller konkurrentträff.');}
 if(input.article.extractionMethod==='paragraphs-fallback'){score-=10;reasons.push('Generisk paragraph-fallback ger lägre innehållssäkerhet.');}
 if(input.article.extractionMethod==='none'){score-=25;reasons.push('Artikeltext kunde inte verifieras.');}

 score=Math.max(0,Math.min(100,Math.round(score)));
 const strongContext=input.competitors.length>0||input.geographies.length>0||strategicHits>0||earlyEvent||competitorStrategicEvent;
 const missingTopicWithoutCompetitorEvent=topicHits===0&&!competitorStrategicEvent;
 const decision:NewsQualityDecision=
   missingTopicWithoutCompetitorEvent||score<32?'reject':
   (score>=52||earlyEvent&&score>=42)&&strongContext?'accept':
   score>=42?'accept-thin':'reject';

 if(decision==='accept')reasons.unshift('Tydlig ämnesrelevans med tillräckligt artikelunderlag.');
 if(decision==='accept-thin')reasons.unshift('Relevant men tunt underlag; behåll med lägre vikt.');
 return {decision,qualityScore:score,topicHits,titleTopicHits,strategicHits,bodyChars:body.length,reasons};
}

export function summarizeNewsQuality(items:NewsQualityAssessment[]){
 return {
  assessed:items.length,
  accepted:items.filter(x=>x.decision==='accept').length,
  acceptedThin:items.filter(x=>x.decision==='accept-thin').length,
  rejected:items.filter(x=>x.decision==='reject').length,
  averageQuality:items.length?Math.round(items.reduce((a,b)=>a+b.qualityScore,0)/items.length):0,
 };
}