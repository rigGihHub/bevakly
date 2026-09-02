import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { assessEvidence, sourceDomain } from "@/lib/intelligence/evidence";

export type StrategicMoveKind = "expansion" | "capability-build" | "consolidation" | "market-entry" | "strategic-shift";
export type StrategicMoveConfidence = "hög" | "medel" | "låg";

export type StrategicMove = {
  id: string;
  actor: string;
  kind: StrategicMoveKind;
  label: string;
  hypothesis: string;
  confidence: StrategicMoveConfidence;
  score: number;
  evidenceCount: number;
  independentSources: number;
  evidenceDomains: string[];
  categories: string[];
  geographies: string[];
  firstSeen: string | null;
  lastSeen: string | null;
  evidence: { id:string; title:string; category:string|null; geography:string|null; publishedAt:string|null; sourceDomain:string|null; relevanceScore:number|null }[];
  supportingSignals: string[];
  counterEvidence: string[];
  watchNext: string[];
  caveat: string;
};

function uniq<T>(xs:T[]){return [...new Set(xs)]}
function ageDays(value:string|null,now:Date){if(!value)return Infinity;const t=new Date(value).getTime();return Number.isNaN(t)?Infinity:(now.getTime()-t)/86400000}
function slug(s:string){return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9åäö]+/gi,'-').replace(/^-|-$/g,'')}
function geoParts(rows:HistoricalEvent[]){return uniq(rows.flatMap(e=>e.geography?e.geography.split(',').map(x=>x.trim()).filter(Boolean):[]))}
function dates(rows:HistoricalEvent[]){const d=rows.map(x=>x.publishedAt).filter((x):x is string=>Boolean(x)).sort();return {firstSeen:d[0]??null,lastSeen:d.at(-1)??null}}
function titleText(rows:HistoricalEvent[]){return rows.map(x=>x.title.toLocaleLowerCase('sv-SE')).join(' | ')}

const positiveCats=new Set(["Investering","Etablering","Teknik","Organisation","Avtal","Förvärv"]);
const capabilityCats=new Set(["Investering","Teknik","Organisation"]);
const marketCats=new Set(["Etablering","Avtal","Investering"]);
const counterPatterns=[
  {re:/\b(pausar|pausad|skjuter upp|senarel[aä]gger|avbryter|st[äa]ller in)\b/i,label:"paus eller uppskjutet initiativ"},
  {re:/\b(stänger|nedläggning|lägger ned|varslar|uppsägningar|minskar investering|drar tillbaka)\b/i,label:"reträtt, neddragning eller kapacitetsminskning"},
  {re:/\b(försenad|försening|tillstånd avslås|avslag)\b/i,label:"försening eller regulatoriskt hinder"},
];

function kindFor(categories:string[],geos:string[],text:string):StrategicMoveKind{
  const c=new Set(categories);
  if(c.has('Förvärv'))return 'consolidation';
  if(c.has('Etablering') && (c.has('Investering')||c.has('Avtal')))return 'market-entry';
  if([...capabilityCats].filter(x=>c.has(x)).length>=2 && [...marketCats].some(x=>c.has(x)))return 'expansion';
  if([...capabilityCats].filter(x=>c.has(x)).length>=2)return 'capability-build';
  if(/strateg|omställ|ny affär|nytt erbjudande|positioner/i.test(text))return 'strategic-shift';
  return geos.length>=2?'expansion':'capability-build';
}
function labelFor(kind:StrategicMoveKind){return kind==='expansion'?'Möjlig expansionsrörelse':kind==='capability-build'?'Möjlig kapacitetsuppbyggnad':kind==='consolidation'?'Möjlig konsolideringsrörelse':kind==='market-entry'?'Möjligt marknadsinträde':'Möjligt strategiskt skifte'}
function watchFor(kind:StrategicMoveKind,cats:string[]){
  const out:string[]=[];
  if(kind==='expansion'||kind==='market-entry')out.push('nya etableringar, tillstånd, lokaler eller geografiska satsningar','rekryteringar och lokala ledningsroller','nya kunder, partnerskap eller kommersiella avtal');
  if(kind==='capability-build')out.push('nya teknikpartnerskap, pilotprojekt eller investeringar','specialistrekryteringar och organisationsförändringar','om kapacitetsbyggandet följs av kommersiella lanseringar');
  if(kind==='consolidation')out.push('ytterligare förvärv eller integrationsbesked','förändringar i varumärke, ledning och geografisk närvaro','kapacitets- eller kundflyttar efter affären');
  if(kind==='strategic-shift')out.push('fler initiativ inom samma nya tema','förändrade investeringar eller partnerskap','ledningskommunikation som bekräftar riktningen');
  if(cats.includes('Teknik'))out.push('om tekniksatsningen går från pilot till skala');
  return uniq(out).slice(0,4);
}

export function deriveStrategicMoves(events:HistoricalEvent[],requestedActors:string[]=[],now=new Date()):StrategicMove[]{
  const recent=events.filter(e=>ageDays(e.publishedAt,now)<=120);
  const names=uniq([...requestedActors.filter(Boolean),...recent.flatMap(e=>e.competitors)]);
  const moves:StrategicMove[]=[];
  for(const actor of names){
    const rows=recent.filter(e=>e.competitors.some(c=>c.localeCompare(actor,'sv-SE',{sensitivity:'base'})===0));
    if(rows.length<3)continue;
    const counterRows=rows.filter(r=>counterPatterns.some(p=>p.re.test(r.title)));
    const counterIds=new Set(counterRows.map(r=>r.id));
    const signalRows=rows.filter(e=>!counterIds.has(e.id) && (positiveCats.has(e.category??'') || /invest|etabler|rekryt|chef|partner|pilot|förvärv|köper|teknik|anlägg/i.test(e.title)));
    const categories=uniq(signalRows.map(e=>e.category).filter((x):x is string=>Boolean(x)));
    if(signalRows.length<3 || categories.length<2)continue;
    const geos=geoParts(signalRows);
    const evidence=assessEvidence(signalRows);
    const text=titleText(signalRows);
    const kind=kindFor(categories,geos,text);
    const counterEvidence=uniq(counterRows.flatMap(r=>counterPatterns.filter(p=>p.re.test(r.title)).map(p=>`${p.label}: ${r.title}`))).slice(0,3);
    const diversity=Math.min(24,categories.length*6);
    const sourcePower=Math.min(30,evidence.independentSources*10);
    const eventPower=Math.min(24,signalRows.length*5);
    const geoPower=Math.min(10,Math.max(0,geos.filter(x=>x!=='Sverige').length)*4);
    const freshness=signalRows.some(e=>ageDays(e.publishedAt,now)<=30)?10:4;
    const counterPenalty=Math.min(18,counterEvidence.length*7);
    const score=Math.max(20,Math.min(96,Math.round(20+diversity+sourcePower+eventPower+geoPower+freshness-counterPenalty)));
    let confidence:StrategicMoveConfidence=score>=78?'hög':score>=58?'medel':'låg';
    if(evidence.independentSources<2)confidence='låg';
    else if(evidence.independentSources<3 && confidence==='hög')confidence='medel';
    if(counterEvidence.length>=2 && confidence==='hög')confidence='medel';
    const support=[
      `${signalRows.length} relaterade händelser inom ${categories.slice(0,5).join(', ')}.`,
      evidence.note,
      geos.length?`Observerad geografi: ${geos.slice(0,4).join(', ')}.`:'Ingen tydlig geografisk koncentration har kunnat beläggas.'
    ];
    const range=dates(signalRows);
    moves.push({
      id:`move-${slug(actor)}-${kind}`,actor,kind,label:labelFor(kind),
      hypothesis:`Kombinationen av ${categories.slice(0,4).join(', ').toLocaleLowerCase('sv-SE')} kan tyda på ${labelFor(kind).replace(/^Möjlig(t)? /,'').toLocaleLowerCase('sv-SE')} hos ${actor}. Sambandet är inte verifierat som företagets uttalade strategi.`,
      confidence,score,evidenceCount:signalRows.length,independentSources:evidence.independentSources,evidenceDomains:evidence.domains,categories,geographies:geos,...range,
      evidence:[...signalRows].sort((a,b)=>new Date(b.publishedAt??0).getTime()-new Date(a.publishedAt??0).getTime()).slice(0,8).map(e=>({id:e.id,title:e.title,category:e.category,geography:e.geography,publishedAt:e.publishedAt,sourceDomain:sourceDomain(e),relevanceScore:e.relevanceScore})),
      supportingSignals:support,counterEvidence:counterEvidence.length?counterEvidence:['Inget tydligt motbevis har hittats i det observerade källunderlaget. Det är inte samma sak som att motbevis saknas.'],
      watchNext:watchFor(kind,categories),
      caveat:'STRATEGISK HYPOTES · Bevakly kopplar ihop observerade signaler. Detta är inte verifierad information om aktörens avsikt, strategi eller framtida agerande.'
    });
  }
  return moves.sort((a,b)=>b.score-a.score||b.independentSources-a.independentSources||b.evidenceCount-a.evidenceCount).slice(0,8);
}
