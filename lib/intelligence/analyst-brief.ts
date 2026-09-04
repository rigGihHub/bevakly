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
  confidence:'Låg'|'Medel'|'Hög';
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
    findings.push({
      id:`history:${change.id}`,
      kind:'förändring',
      headline:`${change.label}: ${change.status}`,
      fact:`${change.current30} händelser senaste 30 dagar, jämfört med cirka ${change.baselineMonthly.toFixed(1)} per månad tidigare (${ratioText}).`,
      interpretation:change.assessment,
      watchNext:watchForCategory(change.dimension==='kategori'?change.label:''),
      confidence:change.confidence,
      evidenceCount:change.evidence.length,
      links:dedupeLinks(change.evidence.map(e=>({title:e.title,url:e.eventUrl??'',source:e.sourceName}))).slice(0,3),
      priority:70+rankConfidence(change.confidence)*8+(change.status.includes('ovanligt')?8:0)+(change.status.includes('ny')?6:0),
    });
  }

  for(const competitor of competitorBaselines){
    if(competitor.warningLevel==='Ingen'||competitor.confidence==='Låg') continue;
    findings.push({
      id:`competitor:${competitor.competitor}`,
      kind:'konkurrent',
      headline:`${competitor.competitor} avviker från sin normalbild`,
      fact:`${competitor.current30} observerade händelser senaste 30 dagar mot cirka ${competitor.baselineMonthly.toFixed(1)} per normalmånad.${competitor.signals.length?` ${competitor.signals.slice(0,2).join(' ')}`:''}`,
      interpretation:competitor.assessment,
      watchNext:`Följ nästa konkreta steg från ${competitor.competitor}: tillstånd, investering, rekrytering, kapacitet, ny geografi eller förvärv.`,
      confidence:competitor.confidence,
      evidenceCount:competitor.evidence.length,
      links:dedupeLinks(competitor.evidence.map(e=>({title:e.title,url:e.eventUrl??'',source:e.sourceName}))).slice(0,3),
      priority:competitor.warningLevel==='Tydlig'?96:82,
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
    findings.push({
      id:`event:${item.url}`,
      kind:'ny utveckling',
      headline:actor?`${actor}: ny relevant utveckling`:geo?`Ny utveckling i ${geo}`:item.title,
      fact:item.factualSummary||item.title,
      interpretation:`Detta är en aktuell händelse med ${item.score}/100 i relevans. ${item.independentSourceCount>=2?'Flera oberoende ursprung stärker signalen.':'Källstödet är fortfarande begränsat, så Bevakly behandlar den som en tidig signal.'}`,
      watchNext:watchForCategory(item.category),
      confidence:item.independentSourceCount>=2&&item.score>=80?'Hög':item.score>=75?'Medel':'Låg',
      evidenceCount:1,
      links:[{title:item.title,url:item.url,source:item.source}],
      priority:item.score+(item.independentSourceCount>=2?8:0),
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
