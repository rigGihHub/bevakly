import type { FusionInput, FusionSourceClass } from './signal-fusion';

export type PendingEvidence={
  evidenceKey:string;
  originatingTimelineId:string;
  gapId:string;
  sourceClass:FusionSourceClass;
  title:string;
  url:string;
  canonicalUrl:string;
  source:string;
  publishedAt:string;
  snippet:string;
  competitors:string[];
  geographies:string[];
  factConfidence:'Låg'|'Medel'|'Hög';
  interpretationConfidence:'Låg'|'Medel'|'Hög';
  score:number;
  discoveredAt:string;
};

export type EvidencePromotionDecision={
  evidenceKey:string;
  decision:'promote'|'hold'|'reject';
  reason:string;
  fusionInput:FusionInput|null;
};

function ageDays(iso:string,now:Date){
  return (now.getTime()-new Date(iso).getTime())/86400000;
}
function validDate(iso:string){return !Number.isNaN(new Date(iso).getTime());}

export function assessEvidencePromotion(e:PendingEvidence,now=new Date()):EvidencePromotionDecision{
  if(!e.evidenceKey||!e.canonicalUrl||!e.title.trim()){
    return {evidenceKey:e.evidenceKey,decision:'reject',reason:'Obligatoriska evidensfält saknas.',fusionInput:null};
  }
  if(!validDate(e.publishedAt)||!validDate(e.discoveredAt)){
    return {evidenceKey:e.evidenceKey,decision:'reject',reason:'Datum kan inte verifieras.',fusionInput:null};
  }
  const publicationAge=ageDays(e.publishedAt,now);
  if(publicationAge>180){
    return {evidenceKey:e.evidenceKey,decision:'reject',reason:'Evidensen är äldre än promotion-fönstret på 180 dagar.',fusionInput:null};
  }
  if(e.factConfidence==='Låg'){
    return {evidenceKey:e.evidenceKey,decision:'hold',reason:'Faktasäkerheten är låg; evidensen hålls utanför fusion.',fusionInput:null};
  }
  if(e.score<55){
    return {evidenceKey:e.evidenceKey,decision:'hold',reason:'Discovery-score är för lågt för automatisk promotion.',fusionInput:null};
  }
  if(!e.competitors.length&&!e.geographies.length){
    return {evidenceKey:e.evidenceKey,decision:'hold',reason:'Saknar både konkurrent- och geografikoppling; automatisk korrelation blir för svag.',fusionInput:null};
  }
  return {
    evidenceKey:e.evidenceKey,
    decision:'promote',
    reason:'Tidigare gap-träff har passerat datum-, relevans- och faktasäkerhetskrav och får delta i ordinarie fusion.',
    fusionInput:{
      id:`promoted-${e.evidenceKey}`,
      title:e.title,
      url:e.canonicalUrl||e.url,
      publishedAt:e.publishedAt,
      sourceClass:e.sourceClass,
      source:e.source,
      competitors:e.competitors,
      geographies:e.geographies,
      text:`${e.title} ${e.snippet}`.trim(),
      factConfidence:e.factConfidence,
    },
  };
}

export function buildEvidencePromotionBatch(items:PendingEvidence[],now=new Date()){
  const decisions=items.map(x=>assessEvidencePromotion(x,now));
  const promoted=decisions.filter(x=>x.decision==='promote'&&x.fusionInput).map(x=>x.fusionInput!);
  return {
    decisions,
    promoted,
    summary:{
      considered:decisions.length,
      promoted:decisions.filter(x=>x.decision==='promote').length,
      held:decisions.filter(x=>x.decision==='hold').length,
      rejected:decisions.filter(x=>x.decision==='reject').length,
      principle:'Endast evidens från en tidigare analyscykel kan promoveras. Promotion betyder att evidensen får delta i fusion – inte att hypotesen automatiskt bekräftas.',
    },
  };
}
