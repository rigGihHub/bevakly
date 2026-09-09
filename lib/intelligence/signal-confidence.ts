import type { EvidenceQuality } from './evidence-quality';

export type ConfidenceLevel='Låg'|'Medel'|'Hög';

export type ConfidenceAssessment={
  level:ConfidenceLevel;
  score:number;
  reasons:string[];
  limitations:string[];
};

const rank=(level:ConfidenceLevel)=>level==='Hög'?3:level==='Medel'?2:1;
const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)));
const levelFor=(score:number):ConfidenceLevel=>score>=78?'Hög':score>=52?'Medel':'Låg';

/**
 * factConfidence answers only: how certain are we that the described event/fact occurred?
 * It must not be inflated by strategic relevance, novelty or publication volume.
 */
export function assessFactConfidence(input:{
  evidence?:EvidenceQuality|null;
  sourceType?:string|null;
  sourceTier?:number|null;
  trustScore?:number|null;
  articleReadOk?:boolean|null;
  explicitPrimarySource?:boolean;
  independentOrigins?:number;
  originalSourceCount?:number;
}):ConfidenceAssessment{
  const reasons:string[]=[];
  const limitations:string[]=[];
  let score=38;
  const sourceType=(input.sourceType??'').toLocaleLowerCase('sv-SE');
  const official=['authority','eu','research','procurement'].includes(sourceType);
  const firstParty=['company','competitor'].includes(sourceType);

  if(official){score+=38;reasons.push('Officiell eller institutionell primärkälla.');}
  else if(firstParty){score+=25;reasons.push('Förstahandskälla för aktörens eget besked.');}
  else if(input.sourceTier===1){score+=28;reasons.push('Källan är klassad som primär/tier 1.');}

  if(input.explicitPrimarySource){score+=14;reasons.push('Original/primärkälla är identifierad.');}
  if(typeof input.trustScore==='number'){
    if(input.trustScore>=85){score+=10;reasons.push('Källan har hög tillförlitlighetsklassning.');}
    else if(input.trustScore<55){score-=10;limitations.push('Källans tillförlitlighetsklassning är låg.');}
  }

  const evidence=input.evidence;
  const independentOrigins=evidence?.independentOrigins??input.independentOrigins??0;
  const originalSourceCount=evidence?.originalSourceCount??input.originalSourceCount??0;
  if(evidence){
    if(evidence.republisherCount>0&&evidence.independentOrigins<=1){score-=8;limitations.push('Flera publiceringar verkar bygga på samma ursprung.');}
  }
  if(independentOrigins>=3){score+=22;reasons.push('Minst tre sannolikt oberoende ursprung stödjer faktumet.');}
  else if(independentOrigins>=2){score+=14;reasons.push('Minst två sannolikt oberoende ursprung stödjer faktumet.');}
  if(originalSourceCount>0){score+=10;reasons.push('Underlaget innehåller primär/originalkälla.');}

  if(input.articleReadOk===false){score-=18;limitations.push('Bevakly kunde inte verifiera artikelns fulltext.');}
  const finalScore=clamp(score);
  return {level:levelFor(finalScore),score:finalScore,reasons,limitations};
}

/**
 * interpretationConfidence answers: how certain are we about what the fact means?
 * High confidence requires corroboration across more than publication/event volume.
 */
export function assessInterpretationConfidence(input:{
  factConfidence:ConfidenceLevel;
  eventCount?:number;
  independentOrigins?:number;
  signalTypeCount?:number;
  historicalDeviationRatio?:number|null;
  newGeographyCount?:number;
  counterEvidenceCount?:number;
  strongEvidenceCount?:number;
}):ConfidenceAssessment{
  const reasons:string[]=[];
  const limitations:string[]=[];
  const events=Math.max(0,input.eventCount??1);
  const origins=Math.max(0,input.independentOrigins??0);
  const signalTypes=Math.max(0,input.signalTypeCount??0);
  const newGeographies=Math.max(0,input.newGeographyCount??0);
  const counter=Math.max(0,input.counterEvidenceCount??0);
  const strong=Math.max(0,input.strongEvidenceCount??0);
  const ratio=input.historicalDeviationRatio??null;

  let score=input.factConfidence==='Hög'?42:input.factConfidence==='Medel'?30:16;
  if(events>=5){score+=14;reasons.push('Flera separata händelser pekar åt samma håll.');}
  else if(events>=3){score+=9;reasons.push('Minst tre händelser stödjer tolkningen.');}
  else if(events===1){limitations.push('Tolkningen bygger i huvudsak på en enskild händelse.');}

  if(origins>=3){score+=15;reasons.push('Tolkningen stöds av flera sannolikt oberoende ursprung.');}
  else if(origins>=2){score+=10;reasons.push('Tolkningen har stöd från mer än ett sannolikt oberoende ursprung.');}
  else limitations.push('Oberoende källstöd är begränsat.');

  if(signalTypes>=3){score+=13;reasons.push('Flera olika signaltyper sammanfaller.');}
  else if(signalTypes>=2){score+=8;reasons.push('Mer än en signaltyp stödjer samma tolkning.');}

  if(ratio!==null&&ratio>=2){score+=10;reasons.push('Aktiviteten avviker tydligt från historisk normalbild.');}
  else if(ratio!==null&&ratio>=1.4){score+=5;reasons.push('Historiken visar en måttlig avvikelse.');}

  if(newGeographies>0){score+=6;reasons.push('Mönstret syns även i ny geografi.');}
  if(strong>=2){score+=6;reasons.push('Flera starka stödjande händelser finns.');}
  if(counter>0){score-=Math.min(24,counter*9);limitations.push(`${counter} motbevis eller motriktade händelser sänker säkerheten.`);}

  // Critical guardrail: event/publication volume alone must never create high interpretation confidence.
  const corroboratingDimensions=(origins>=2?1:0)+(signalTypes>=2?1:0)+(ratio!==null&&ratio>=1.4?1:0)+(newGeographies>0?1:0);
  let finalScore=clamp(score);
  if(corroboratingDimensions===0) finalScore=Math.min(finalScore,49);
  if(corroboratingDimensions===1) finalScore=Math.min(finalScore,74);
  if(rank(input.factConfidence)===1) finalScore=Math.min(finalScore,49);
  if(finalScore<52&&events>=3&&corroboratingDimensions===0)limitations.push('Hög aktivitet i sig räcker inte som strategiskt bevis.');

  return {level:levelFor(finalScore),score:finalScore,reasons,limitations};
}

export function lowerConfidence(level:ConfidenceLevel):'låg'|'medel'|'hög'{
  return level==='Hög'?'hög':level==='Medel'?'medel':'låg';
}
