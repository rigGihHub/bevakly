import type { WatchSource } from './sources';
import type { SourceLearningScore } from './source-learning';
import type { CountyCoverage, CoverageDimension } from './swedish-coverage-gap';

export type CoverageSourceHistory={
  sourceName:string;
  county:string;
  dimension:CoverageDimension;
  events:number;
  recentEvents:number;
  lastSeenAt:string|null;
  score:number;
};

export type CoverageSourceRecommendation={
  county:string;
  dimension:CoverageDimension;
  gapLevel:'svag'|'okänd';
  sourceIds:string[];
  sourceNames:string[];
  strategy:'strengthen-known-source'|'discover-new-source'|'mixed';
  strategyLabel:string;
  historicalEvents:number;
  healthScore:number|null;
  reasons:string[];
  limitation:string;
};

const labels:Record<CoverageDimension,string>={
  procurement:'upphandling',permits:'tillstånd',media:'lokal media',competitors:'konkurrenter',facilities:'anläggning/kapacitet'
};

function norm(s:string){return s.toLocaleLowerCase('sv-SE').trim();}
function sourceFitsDimension(source:WatchSource,dimension:CoverageDimension){
  if(dimension==='media')return source.type==='media';
  if(dimension==='procurement')return source.type==='procurement'||source.type==='authority'||source.type==='company';
  if(dimension==='permits')return source.type==='authority'||source.type==='company';
  if(dimension==='competitors')return source.type==='competitor'||source.type==='media';
  return source.type==='company'||source.type==='authority'||source.type==='competitor'||source.type==='media';
}
function sourceInCounty(source:WatchSource,county:string){return (source.regions??[]).some(r=>norm(r)===norm(county));}

export function buildCoverageSourceRecommendations(args:{
  rows:CountyCoverage[];
  sources:WatchSource[];
  sourceLearning:SourceLearningScore[];
  coverageHistory:CoverageSourceHistory[];
  maxRecommendations?:number;
}):CoverageSourceRecommendation[]{
  const max=Math.max(0,args.maxRecommendations??6);
  const learning=new Map(args.sourceLearning.map(x=>[x.sourceId,x]));
  const sourceByName=new Map(args.sources.map(x=>[norm(x.name),x]));
  const gaps=args.rows
    .filter(r=>r.overall==='svag'||r.overall==='okänd')
    .flatMap(row=>(Object.entries(row.dimensions) as Array<[CoverageDimension,CountyCoverage['dimensions'][CoverageDimension]]>)
      .filter(([,v])=>v.level==='svag'||v.level==='okänd')
      .map(([dimension,value])=>({row,dimension,value})))
    .sort((a,b)=>a.value.score-b.value.score||a.row.score-b.row.score||a.row.county.localeCompare(b.row.county,'sv'))
    .slice(0,max);

  return gaps.map(({row,dimension,value})=>{
    const historical=args.coverageHistory
      .filter(h=>norm(h.county)===norm(row.county)&&h.dimension===dimension)
      .sort((a,b)=>b.score-a.score||b.events-a.events);
    const historicalSources=historical.map(h=>sourceByName.get(norm(h.sourceName))).filter((x):x is WatchSource=>Boolean(x));
    const regional=args.sources.filter(s=>s.enabled&&sourceInCounty(s,row.county)&&sourceFitsDimension(s,dimension));
    const candidates=[...new Map([...historicalSources,...regional].map(s=>[s.id,s] as const)).values()]
      .map(source=>({source,learned:learning.get(source.id),history:historical.find(h=>norm(h.sourceName)===norm(source.name))}))
      .sort((a,b)=>((b.history?.score??0)+(b.learned?.score??0))-((a.history?.score??0)+(a.learned?.score??0)))
      .slice(0,3);
    const historicalEvents=candidates.reduce((n,x)=>n+(x.history?.events??0),0);
    const healthScores=candidates.map(x=>x.learned?.score).filter((x):x is number=>typeof x==='number');
    const healthScore=healthScores.length?Math.round(healthScores.reduce((a,b)=>a+b,0)/healthScores.length):null;
    const proven=candidates.filter(x=>(x.history?.events??0)>=2&&(x.learned?.score??0)>=45);
    const strategy:CoverageSourceRecommendation['strategy']=proven.length?'strengthen-known-source':candidates.length?'mixed':'discover-new-source';
    const reasons:string[]=[];
    if(proven.length) reasons.push(`${proven.length} befintlig${proven.length===1?'':'a'} källa/källor har både historisk yield och rimlig källhälsa`);
    if(historicalEvents>0) reasons.push(`${historicalEvents} accepterade historiska ${labels[dimension]}-händelser från kandidatkällorna`);
    if(healthScore!==null) reasons.push(`genomsnittlig historisk källpoäng ${healthScore}/100`);
    if(!candidates.length) reasons.push('ingen explicit regional källa matchar luckans signaltyp');
    else if(!historicalEvents) reasons.push('regionala kandidatkällor finns men saknar verifierad historisk yield för just denna lucktyp');
    if(value.healthyRegionalSources===0&&value.regionalSources>0) reasons.push('konfigurerade regionala källor saknade frisk respons i senaste körningen');
    const strategyLabel=strategy==='strengthen-known-source'
      ?`Prioritera fungerande källor som tidigare gett ${labels[dimension]} i ${row.county}`
      :strategy==='mixed'
        ?`Behåll regionala kandidatkällor men lägg discovery-budget på nya ${labels[dimension]}-källor`
        :`Sök efter nya regionala ${labels[dimension]}-källor i ${row.county}`;
    return {
      county:row.county,dimension,gapLevel:value.level as 'svag'|'okänd',
      sourceIds:candidates.map(x=>x.source.id),sourceNames:candidates.map(x=>x.source.name),strategy,strategyLabel,
      historicalEvents,healthScore,reasons,
      limitation:'Rekommendationen bygger på Bevaklys observerade historik och konfigurerade källor. Den bevisar inte att en källa är bäst på marknaden och får inte höja evidensens confidence.'
    };
  });
}
