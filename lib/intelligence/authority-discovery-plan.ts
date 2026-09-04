import { municipalities } from './municipality-registry';
import type { WatchSource } from './sources';

export type DiscoveryTargetKind =
  | 'municipality'
  | 'county-authority'
  | 'national-authority';

export type DiscoveryIntent =
  | 'permit'
  | 'consultation'
  | 'planning'
  | 'land'
  | 'capacity'
  | 'establishment'
  | 'recruitment'
  | 'supervision';

export type DiscoveryTarget = {
  id:string;
  name:string;
  kind:DiscoveryTargetKind;
  county?:string;
  municipalityCode?:string;
  priority:'core'|'extended';
  intents:DiscoveryIntent[];
  queryHints:string[];
  activeSourceIds:string[];
};

const wasteIntents:DiscoveryIntent[]=[
  'permit','consultation','planning','land','capacity','establishment','supervision'
];

const municipalityHints=[
  'avfall tillstånd',
  'återvinning tillstånd',
  'miljöfarlig verksamhet samråd',
  'avfallsanläggning bygglov',
  'återvinning detaljplan',
  'avfall markanvisning',
  'avfallsanläggning kapacitet',
];

const countyHints=[
  'avfall miljöprövningsdelegationen',
  'återvinning tillstånd kungörelse',
  'avfallsanläggning samråd',
  'miljöfarlig verksamhet avfall',
];

function norm(v:string){
  return v.toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function sourceMatch(targetName:string,sources:WatchSource[]){
  const n=norm(targetName);
  return sources.filter(source=>{
    const hay=norm(`${source.id} ${source.name} ${source.description??''}`);
    return hay.includes(n);
  }).map(x=>x.id);
}

export function buildAuthorityDiscoveryPlan(sources:WatchSource[],industryId:string):DiscoveryTarget[]{
  if(industryId!=='waste') return [];

  const municipal:DiscoveryTarget[]=municipalities.map(m=>({
    id:`municipality:${m.code}`,
    name:`${m.name} kommun`,
    kind:'municipality',
    county:m.county,
    municipalityCode:m.code,
    priority:'extended',
    intents:wasteIntents,
    queryHints:municipalityHints.map(q=>`${m.name} kommun ${q}`),
    activeSourceIds:sourceMatch(`${m.name} kommun`,sources),
  }));

  const counties=[...new Set(municipalities.map(x=>x.county))].sort((a,b)=>a.localeCompare(b,'sv'));
  const regional:DiscoveryTarget[]=counties.map(county=>({
    id:`county:${norm(county).replace(/[^a-z0-9]+/g,'-')}`,
    name:`Länsstyrelsen ${county.replace(/ län$/,'')}`,
    kind:'county-authority',
    county,
    priority:'core',
    intents:['permit','consultation','capacity','establishment','supervision'],
    queryHints:countyHints.map(q=>`${county} ${q}`),
    activeSourceIds:sourceMatch(county.replace(/ län$/,''),sources),
  }));

  const national:DiscoveryTarget[]=[
    {
      id:'national:naturvardsverket',
      name:'Naturvårdsverket',
      kind:'national-authority',
      priority:'core',
      intents:['permit','supervision','capacity'],
      queryHints:['Naturvårdsverket avfall tillstånd','Naturvårdsverket avfall tillsyn','Naturvårdsverket avfall regler'],
      activeSourceIds:sourceMatch('Naturvårdsverket',sources),
    },
    {
      id:'national:regeringen',
      name:'Regeringen',
      kind:'national-authority',
      priority:'core',
      intents:['permit','capacity','establishment'],
      queryHints:['Regeringen avfall återvinning proposition','Regeringen cirkulär ekonomi avfall'],
      activeSourceIds:sourceMatch('Regeringen',sources),
    },
  ];

  return [...national,...regional,...municipal];
}

export function summarizeAuthorityDiscoveryPlan(targets:DiscoveryTarget[]){
  const municipalities=targets.filter(x=>x.kind==='municipality');
  const counties=targets.filter(x=>x.kind==='county-authority');
  const active=targets.filter(x=>x.activeSourceIds.length>0);
  const gaps=targets.filter(x=>x.activeSourceIds.length===0);
  return {
    totalTargets:targets.length,
    municipalityTargets:municipalities.length,
    countyTargets:counties.length,
    activeTargets:active.length,
    uncoveredTargets:gaps.length,
    activeMunicipalities:municipalities.filter(x=>x.activeSourceIds.length>0).length,
    activeCounties:counties.filter(x=>x.activeSourceIds.length>0).length,
    intentCounts:targets.flatMap(x=>x.intents).reduce<Record<string,number>>((acc,intent)=>{
      acc[intent]=(acc[intent]??0)+1; return acc;
    },{}),
    sampleGaps:gaps.slice(0,12).map(x=>({id:x.id,name:x.name,kind:x.kind,county:x.county??null,queryHints:x.queryHints.slice(0,2)})),
  };
}
