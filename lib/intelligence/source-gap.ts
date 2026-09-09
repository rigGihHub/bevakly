export type GapHypothesis='expansion'|'facility-or-capacity'|'contract-or-market-move'|'regulatory-or-legal'|'multi-source-change';

export type SourceGapInput={
  timelineId:string;
  headline:string;
  hypothesis:GapHypothesis;
  sourceClasses:string[];
  stage:string;
  interpretationConfidence:'Låg'|'Medel'|'Hög';
  escalationScore:number;
  competitors:string[];
  geographies:string[];
};

export type SourceGap={
  id:string;
  label:string;
  sourceClasses:string[];
  priority:'Hög'|'Medel'|'Låg';
  why:string;
  searchIntent:string;
};

export type SourceGapResult={
  timelineId:string;
  headline:string;
  missing:SourceGap[];
  covered:string[];
  nextBestSearch:string|null;
  completeness:'Låg'|'Medel'|'Hög';
  explanation:string;
};

type Requirement={id:string;label:string;classes:string[];why:string;intent:string};

const requirements:Record<GapHypothesis,Requirement[]>={
  expansion:[
    {id:'planning',label:'Kommunalt plan-/markärende',classes:['planning','municipal'],why:'Kan visa om etableringen har fått formell lokal förankring.',intent:'Sök kommunala protokoll, markanvisning, detaljplan och planbesked.'},
    {id:'environmental',label:'Miljösamråd eller tillstånd',classes:['environmental'],why:'Ger starkare stöd för faktisk anläggning eller kapacitetsökning.',intent:'Sök Länsstyrelsens kungörelser, samråd och miljöprövning.'},
    {id:'jobs',label:'Rekryteringssignal',classes:['jobs'],why:'Kan indikera lokal operativ uppbyggnad före offentlig lansering.',intent:'Sök officiella karriärsidor och lokala rekryteringar.'},
    {id:'official',label:'Konkurrentens eget besked',classes:['authority','news'],why:'Kan bekräfta investerings- eller etableringsavsikt.',intent:'Sök bolagets pressrum, webbplats och officiella nyheter.'},
  ],
  'facility-or-capacity':[
    {id:'environmental',label:'Miljöprövning/tillstånd',classes:['environmental'],why:'Tillstånd och villkor avgör om kapacitetsförändringen är möjlig.',intent:'Sök miljötillstånd, ändringstillstånd, samråd och villkor.'},
    {id:'planning',label:'Bygg-/planärende',classes:['planning','municipal'],why:'Kan styrka fysisk förändring av anläggning eller mark.',intent:'Sök detaljplan, bygglov, markärenden och kommunala protokoll.'},
    {id:'execution',label:'Genomförandesignal',classes:['news','authority'],why:'Byggstart, driftsättning eller investeringsbesked minskar osäkerheten.',intent:'Sök byggstart, investering, driftsättning och kapacitetsbesked.'},
  ],
  'contract-or-market-move':[
    {id:'award',label:'Tilldelningsbeslut eller avtal',classes:['municipal','authority','legal'],why:'Ger stöd för att marknadsrörelsen faktiskt materialiserats.',intent:'Sök tilldelningsbeslut, avtal, TED och upphandlande myndighet.'},
    {id:'execution',label:'Operativ start',classes:['news','authority'],why:'Visar om kontraktet faktiskt går in i genomförande.',intent:'Sök trafik-/uppdragsstart, driftövertagande och kundbesked.'},
    {id:'jobs',label:'Lokal rekrytering',classes:['jobs'],why:'Kan stödja att vinnande aktör skalar upp i berörd geografi.',intent:'Sök rekryteringar i berörd region.'},
  ],
  'regulatory-or-legal':[
    {id:'legal',label:'Beslut/dom/överklagande',classes:['legal'],why:'Själva rättsliga utfallet behövs för att förstå effekten.',intent:'Sök domstolsbeslut, överklaganden och ärendestatus.'},
    {id:'authority',label:'Myndighetsbesked',classes:['environmental','competition','municipal','authority'],why:'Kan förtydliga villkor, tidsfrister och praktisk betydelse.',intent:'Sök ansvarig myndighets beslut och kungörelser.'},
    {id:'followup',label:'Följdeffekt i verksamheten',classes:['news'],why:'Visar om det juridiska utfallet faktiskt får operativ marknadseffekt.',intent:'Sök driftförändring, investering, kapacitetsbesked eller kundpåverkan.'},
  ],
  'multi-source-change':[
    {id:'official',label:'Formell/officiell källa',classes:['municipal','environmental','legal','competition','planning','authority'],why:'En formell källa behövs för att stärka en bred förändringshypotes.',intent:'Sök kommun, myndighet, domstol eller annat primärunderlag.'},
    {id:'company',label:'Aktörens eget besked',classes:['news','authority'],why:'Kan tydliggöra vilken förändring aktören själv beskriver.',intent:'Sök bolagets pressrum och officiella webbplats.'},
    {id:'independent',label:'Oberoende bekräftelse',classes:['news'],why:'En extern källa kan minska risken att samma påstående bara återpublicerats.',intent:'Sök oberoende bransch- eller lokalmedia.'},
  ],
};

function covered(req:Requirement,classes:string[]){return req.classes.some(x=>classes.includes(x));}
function priority(input:SourceGapInput,index:number):SourceGap['priority']{
  if(index===0&&input.interpretationConfidence!=='Hög')return 'Hög';
  if(input.escalationScore>=70&&index<2)return 'Hög';
  return index<2?'Medel':'Låg';
}

export function detectSourceGaps(input:SourceGapInput):SourceGapResult{
  const reqs=requirements[input.hypothesis];
  const missing=reqs.filter(r=>!covered(r,input.sourceClasses)).map((r,i)=>({
    id:r.id,
    label:r.label,
    sourceClasses:r.classes,
    priority:priority(input,i),
    why:r.why,
    searchIntent:r.intent,
  }));
  const coveredLabels=reqs.filter(r=>covered(r,input.sourceClasses)).map(r=>r.label);
  const completeness=missing.length===0?'Hög':missing.length<=Math.max(1,Math.floor(reqs.length/3))?'Medel':'Låg';
  return {
    timelineId:input.timelineId,
    headline:input.headline,
    missing,
    covered:coveredLabels,
    nextBestSearch:missing[0]?.searchIntent??null,
    completeness,
    explanation:missing.length
      ?`${coveredLabels.length} av ${reqs.length} förväntade bevisområden är täckta. ${missing.length} saknas fortfarande.`
      :`Alla ${reqs.length} centrala bevisområden för denna hypotes finns representerade i aktuell beviskedja.`,
  };
}

export function buildSourceGapResults(inputs:SourceGapInput[]){
  return inputs.map(detectSourceGaps).sort((a,b)=>{
    const pa=a.missing.filter(x=>x.priority==='Hög').length;
    const pb=b.missing.filter(x=>x.priority==='Hög').length;
    return pb-pa||b.missing.length-a.missing.length;
  });
}

export function summarizeSourceGaps(items:SourceGapResult[]){
  return {
    cases:items.length,
    complete:items.filter(x=>x.missing.length===0).length,
    withHighPriorityGap:items.filter(x=>x.missing.some(g=>g.priority==='Hög')).length,
    totalMissing:items.reduce((n,x)=>n+x.missing.length,0),
  };
}
