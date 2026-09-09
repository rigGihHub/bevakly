import { assessFactConfidence, assessInterpretationConfidence, type ConfidenceLevel } from './signal-confidence';
export type AnalystFeedItem = {
  title:string;
  url:string;
  source:string;
  publishedAt:string;
  category:string;
  score:number;
  factualSummary:string;
  geographies:string[];
  competitors:string[];
  independentSourceCount:number;
  evidence:string;
};

export type AnalystHistoricalChange = {
  id:string;
  dimension:'kategori'|'geografi'|'konkurrent';
  label:string;
  current30:number;
  baselineMonthly:number;
  ratio:number|null;
  confidence:'Låg'|'Medel'|'Hög';
  status:string;
  assessment:string;
  evidence:Array<{title:string;eventUrl?:string|null;publishedAt?:string|null;sourceName?:string|null}>;
};

export type AnalystCompetitorBaseline = {
  competitor:string;
  current30:number;
  baselineMonthly:number;
  ratio:number|null;
  warningLevel:'Ingen'|'Bevaka'|'Tydlig';
  confidence:'Låg'|'Medel'|'Hög';
  independentSources:number;
  newGeographies:string[];
  signals:string[];
  assessment:string;
  evidence:Array<{title:string;eventUrl?:string|null;publishedAt?:string|null;sourceName?:string|null}>;
};

export type AnalystFinding = {
  id:string;
  kind:'förändring'|'konkurrent'|'ny utveckling';
  headline:string;
  fact:string;
  interpretation:string;
  watchNext:string;
  confidence:ConfidenceLevel;
  factConfidence:ConfidenceLevel;
  interpretationConfidence:ConfidenceLevel;
  confidenceReasons:string[];
  confidenceLimitations:string[];
  evidenceCount:number;
  links:Array<{title:string;url:string;source?:string|null}>;
  priority:number;
};

const rankConfidence=(v:'Låg'|'Medel'|'Hög')=>v==='Hög'?3:v==='Medel'?2:1;

function watchForCategory(category:string){
  const c=category.toLocaleLowerCase('sv-SE');
  if(c.includes('invest')||c.includes('etabler')||c.includes('anlägg')) return 'Följ tillstånd, byggstart, kapacitet och om fler aktörer gör liknande investeringar.';
  if(c.includes('regel')||c.includes('lag')||c.includes('politik')) return 'Följ beslut, ikraftträdande och hur myndigheter, kunder och större aktörer börjar anpassa sig.';
  if(c.includes('förvärv')||c.includes('m&a')) return 'Följ integration, geografisk räckvidd och om konsolideringen fortsätter.';
  if(c.includes('tekn')||c.includes('innovation')) return 'Följ om tekniken går från pilot till faktisk investering eller bred kommersiell användning.';
  return 'Följ om samma signal återkommer i fler oberoende källor eller leder till en konkret marknadsförändring.';
}

function dedupeLinks(links:Array<{title:string;url:string;source?:string|null}>){
  const seen=new Set<string>();
  return links.filter(x=>{
    if(!x.url||seen.has(x.url)) return false;
    seen.add(x.url); return true;
  });
}

export function buildAnalystBrief(
  items:AnalystFeedItem[],
  historicalChanges:AnalystHistoricalChange[],
  competitorBaselines:AnalystCompetitorBaseline[],
  limit=5,
):AnalystFinding[]{
  const findings:AnalystFinding[]=[];

  for(const change of historicalChanges){
    if(change.confidence==='Låg') continue;
    const ratioText=change.ratio!==null?`${change.ratio}× den historiska månadsnivån`:`${change.current30} händelser senaste 30 dagarna`;
    const sourceCount=new Set(change.evidence.map(e=>e.sourceName).filter(Boolean)).size;
    const factAssessment=assessFactConfidence({sourceType:'media',articleReadOk:true,independentOrigins:sourceCount});
    const interpretationAssessment=assessInterpretationConfidence({
      factConfidence:factAssessment.level,eventCount:change.current30,independentOrigins:sourceCount,
      historicalDeviationRatio:change.ratio,signalTypeCount:change.dimension==='kategori'?1:0
    });
    findings.push({
      id:`history:${change.id}`,
      kind:'förändring',
      headline:`${change.label}: ${change.status}`,
      fact:`${change.current30} händelser senaste 30 dagar, jämfört med cirka ${change.baselineMonthly.toFixed(1)} per månad tidigare (${ratioText}).`,
      interpretation:change.assessment,
      watchNext:watchForCategory(change.dimension==='kategori'?change.label:''),
      confidence:interpretationAssessment.level,
      factConfidence:factAssessment.level,interpretationConfidence:interpretationAssessment.level,
      confidenceReasons:[...factAssessment.reasons,...interpretationAssessment.reasons],
      confidenceLimitations:[...factAssessment.limitations,...interpretationAssessment.limitations],
      evidenceCount:change.evidence.length,
      links:dedupeLinks(change.evidence.map(e=>({title:e.title,url:e.eventUrl??'',source:e.sourceName}))).slice(0,3),
      priority:70+rankConfidence(interpretationAssessment.level)*8+(change.status.includes('ovanligt')?8:0)+(change.status.includes('ny')?6:0),
    });
  }

  for(const competitor of competitorBaselines){
    if(competitor.warningLevel==='Ingen'||competitor.confidence==='Låg') continue;
    const factAssessment=assessFactConfidence({sourceType:'media',articleReadOk:true,independentOrigins:competitor.independentSources});
    const interpretationAssessment=assessInterpretationConfidence({
      factConfidence:factAssessment.level,eventCount:competitor.current30,independentOrigins:competitor.independentSources,
      signalTypeCount:Math.max(1,competitor.signals.filter(s=>!s.includes('separata källor')).length),
      historicalDeviationRatio:competitor.ratio,newGeographyCount:competitor.newGeographies.length
    });
    findings.push({
      id:`competitor:${competitor.competitor}`,
      kind:'konkurrent',
      headline:`${competitor.competitor} avviker från sin normalbild`,
      fact:`${competitor.current30} observerade händelser senaste 30 dagar mot cirka ${competitor.baselineMonthly.toFixed(1)} per normalmånad.${competitor.signals.length?` ${competitor.signals.slice(0,2).join(' ')}`:''}`,
      interpretation:competitor.assessment,
      watchNext:`Följ nästa konkreta steg från ${competitor.competitor}: tillstånd, investering, rekrytering, kapacitet, ny geografi eller förvärv.`,
      confidence:interpretationAssessment.level,
      factConfidence:factAssessment.level,interpretationConfidence:interpretationAssessment.level,
      confidenceReasons:[...factAssessment.reasons,...interpretationAssessment.reasons],
      confidenceLimitations:[...factAssessment.limitations,...interpretationAssessment.limitations],
      evidenceCount:competitor.evidence.length,
      links:dedupeLinks(competitor.evidence.map(e=>({title:e.title,url:e.eventUrl??'',source:e.sourceName}))).slice(0,3),
      priority:(competitor.warningLevel==='Tydlig'?88:76)+rankConfidence(interpretationAssessment.level)*3,
    });
  }

  const recent=[...items]
    .filter(x=>Date.now()-new Date(x.publishedAt).getTime()<=7*86400000)
    .sort((a,b)=>b.score-a.score||b.independentSourceCount-a.independentSourceCount);

  for(const item of recent){
    if(item.score<72) continue;
    const alreadyCovered=findings.some(f=>
      item.competitors.some(c=>f.headline.toLocaleLowerCase('sv-SE').includes(c.toLocaleLowerCase('sv-SE'))) ||
      f.headline.toLocaleLowerCase('sv-SE').includes(item.category.toLocaleLowerCase('sv-SE'))
    );
    if(alreadyCovered) continue;
    const actor=item.competitors[0];
    const geo=item.geographies[0];
    const factAssessment=assessFactConfidence({sourceType:'media',articleReadOk:true,independentOrigins:item.independentSourceCount});
    const interpretationAssessment=assessInterpretationConfidence({factConfidence:factAssessment.level,eventCount:1,independentOrigins:item.independentSourceCount});
    findings.push({
      id:`event:${item.url}`,
      kind:'ny utveckling',
      headline:actor?`${actor}: ny relevant utveckling`:geo?`Ny utveckling i ${geo}`:item.title,
      fact:item.factualSummary||item.title,
      interpretation:`Detta är en aktuell och relevant händelse. ${item.independentSourceCount>=2?'Flera sannolikt oberoende ursprung stärker faktastödet.':'Den strategiska betydelsen är fortfarande osäker och behandlas som en tidig tolkning.'}`,
      watchNext:watchForCategory(item.category),
      confidence:interpretationAssessment.level,
      factConfidence:factAssessment.level,interpretationConfidence:interpretationAssessment.level,
      confidenceReasons:[...factAssessment.reasons,...interpretationAssessment.reasons],
      confidenceLimitations:[...factAssessment.limitations,...interpretationAssessment.limitations],
      evidenceCount:1,
      links:[{title:item.title,url:item.url,source:item.source}],
      priority:item.score+(item.independentSourceCount>=2?4:0)+rankConfidence(interpretationAssessment.level)*2,
    });
  }

  const kindSeen=new Map<string,number>();
  const ordered=findings.sort((a,b)=>b.priority-a.priority||rankConfidence(b.confidence)-rankConfidence(a.confidence));
  const result:AnalystFinding[]=[];
  for(const finding of ordered){
    const count=kindSeen.get(finding.kind)??0;
    if(count>=3) continue;
    result.push(finding); kindSeen.set(finding.kind,count+1);
    if(result.length>=Math.max(1,limit)) break;
  }
  return result;
}
