import type { DiscoveryProviderQuery } from './discovery-provider';
import type { CountyCoverage, CoverageDimension } from './swedish-coverage-gap';

export type CoverageGapDiscoveryPlan={
  queue:DiscoveryProviderQuery[];
  countiesSelected:number;
  dimensionsSelected:number;
  maxQueries:number;
  principle:string;
};

const dimensionLabels:Record<CoverageDimension,string>={
  procurement:'upphandling',
  permits:'tillstånd',
  media:'lokal marknadsbevakning',
  competitors:'konkurrentaktivitet',
  facilities:'anläggning och kapacitet',
};

function queryFor(county:string,dimension:CoverageDimension):Pick<DiscoveryProviderQuery,'query'|'sourceClass'|'allowedHosts'>{
  const c=`"${county}"`;
  if(dimension==='procurement') return {sourceClass:'authority',query:`${c} (upphandling OR tilldelningsbeslut OR marknadsdialog OR RFI OR entreprenad OR avtal OR förlängning OR option) (avfall OR återvinning OR insamling OR behandling)`};
  if(dimension==='permits') return {sourceClass:'environmental-record',allowedHosts:['lansstyrelsen.se','domstol.se'],query:`${c} (miljötillstånd OR miljöprövning OR samråd OR kungörelse OR överklagande) (avfall OR återvinning OR anläggning)`};
  if(dimension==='competitors') return {sourceClass:'news',query:`${c} (PreZero OR "Ragn-Sells" OR "Stena Recycling" OR REMONDIS OR Verdis OR Ohlssons) (avfall OR återvinning OR investering OR etablering OR kontrakt OR kapacitet)`};
  if(dimension==='facilities') return {sourceClass:'news',query:`${c} (avfallsanläggning OR återvinningsanläggning OR omlastning OR kapacitet OR byggstart OR driftstart OR investering OR deponi OR förbränning)`};
  return {sourceClass:'news',query:`${c} (avfall OR återvinning OR insamling OR återvinningscentral OR avfallsanläggning OR entreprenad)`};
}

function levelRank(level:CountyCoverage['overall']){return level==='okänd'?0:level==='svag'?1:level==='medel'?2:3;}
function dimensionRank(level:string){return level==='okänd'?0:level==='svag'?1:level==='medel'?2:3;}

export function buildCoverageGapDiscoveryQueue(rows:CountyCoverage[],now=new Date(),maxQueries=4):CoverageGapDiscoveryPlan{
  const day=now.toISOString().slice(0,10);
  const candidates=rows
    .filter(row=>row.overall==='svag'||row.overall==='okänd')
    .flatMap(row=>(Object.entries(row.dimensions) as Array<[CoverageDimension,CountyCoverage['dimensions'][CoverageDimension]]>)
      .filter(([,v])=>v.level==='svag'||v.level==='okänd')
      .map(([dimension,value])=>({row,dimension,value})))
    .sort((a,b)=>levelRank(a.row.overall)-levelRank(b.row.overall)||dimensionRank(a.value.level)-dimensionRank(b.value.level)||a.value.score-b.value.score||a.row.score-b.row.score||a.row.county.localeCompare(b.row.county,'sv'))
    .slice(0,Math.max(0,maxQueries));

  const queue=candidates.map(({row,dimension})=>{
    const built=queryFor(row.county,dimension);
    return {
      jobId:`${day}:coverage-gap:${row.county}:${dimension}`,
      targetId:`coverage-gap:${row.county}:${dimension}`,
      targetName:`${row.county} – ${dimensionLabels[dimension]}`,
      county:row.county,
      intent:'coverage-gap',
      query:built.query,
      sourceClass:built.sourceClass,
      allowedHosts:built.allowedHosts,
    } satisfies DiscoveryProviderQuery;
  });

  return {
    queue,
    countiesSelected:new Set(candidates.map(x=>x.row.county)).size,
    dimensionsSelected:candidates.length,
    maxQueries,
    principle:'Coverage gaps only allocate a bounded supplemental discovery budget. They never increase source trust, evidence confidence or case confidence by themselves.',
  };
}
