import type { DiscoveryProviderQuery } from './discovery-provider';
import type { SourceGapResult } from './source-gap';
import { verifiedMunicipalProtocolSources } from './municipal-protocol-discovery';

export type GapDrivenDiscoveryPlan={
  queue:DiscoveryProviderQuery[];
  selectedGaps:number;
  casesCovered:number;
  maxQueries:number;
  budgetMode:'bounded-second-pass';
  note:string;
};

const officialHosts={
  environmental:['lansstyrelsen.se'],
  legal:['domstol.se'],
  planning:['boverket.se'],
  competition:['konkurrensverket.se'],
};

function norm(v:string){return v.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9åäö]+/g,' ').replace(/\s+/g,' ').trim();}
function site(hosts:string[]){return hosts.length?`site:${hosts[0]} `:'';}
function municipalHosts(geographies:string[]){
  const wanted=new Set(geographies.map(norm));
  const match=verifiedMunicipalProtocolSources.find(x=>wanted.has(norm(x.municipality)));
  return match?.hosts??[];
}

function queryForGap(gapId:string,headline:string,competitors:string[],geographies:string[]){
  const actor=competitors[0]??'';
  const geo=geographies[0]??'';
  const subject=[actor,geo].filter(Boolean).map(x=>`"${x}"`).join(' ');
  if(gapId==='environmental')return {hosts:officialHosts.environmental,sourceClass:'environmental-record' as const,query:`${site(officialHosts.environmental)}${subject} (samråd OR miljötillstånd OR miljöprövning OR kungörelse OR ändringstillstånd) avfall återvinning`};
  if(gapId==='planning'){
    const municipal=municipalHosts(geographies);
    if(municipal.length)return {hosts:municipal,sourceClass:'municipal-protocol' as const,query:`${site(municipal)}${subject} (protokoll OR tjänsteutlåtande OR detaljplan OR planbesked OR markanvisning OR bygglov)`};
    return {hosts:officialHosts.planning,sourceClass:'planning-record' as const,query:`${site(officialHosts.planning)}${subject} (detaljplan OR planbesked OR mark OR bygglov) industri avfall återvinning`};
  }
  if(gapId==='legal')return {hosts:officialHosts.legal,sourceClass:'legal-record' as const,query:`${site(officialHosts.legal)}${subject} (dom OR beslut OR överklagande OR mark- och miljödomstol) avfall återvinning`};
  if(gapId==='authority')return {hosts:[...officialHosts.environmental,...officialHosts.competition,...officialHosts.legal],sourceClass:'authority' as const,query:`${subject} (beslut OR kungörelse OR villkor OR myndighet) avfall återvinning`};
  if(gapId==='award')return {hosts:[],sourceClass:'authority' as const,query:`${subject} (tilldelningsbeslut OR kontrakt OR avtal OR upphandling) avfall återvinning`};
  if(gapId==='jobs')return {hosts:[],sourceClass:'news' as const,query:`${subject} (jobb OR rekryterar OR platschef OR produktionschef OR driftchef)`};
  if(gapId==='execution')return {hosts:[],sourceClass:'news' as const,query:`${subject} (byggstart OR driftsättning OR invigning OR uppdragsstart OR driftstart OR kapacitet)`};
  if(gapId==='official'||gapId==='company')return {hosts:[],sourceClass:'authority' as const,query:`${subject} (pressmeddelande OR investering OR etablering OR anläggning OR kapacitet)`};
  if(gapId==='independent'||gapId==='followup')return {hosts:[],sourceClass:'news' as const,query:`${subject} (avfall OR återvinning OR anläggning OR kontrakt OR kapacitet OR etablering)`};
  return {hosts:[],sourceClass:'authority' as const,query:`${subject} ${headline} avfall återvinning`};
}

export function buildGapDrivenDiscoveryQueue(
  gaps:SourceGapResult[],
  context:Map<string,{competitors:string[];geographies:string[]}>,
  now=new Date(),
  maxQueries=4,
):GapDrivenDiscoveryPlan{
  const queue:DiscoveryProviderQuery[]=[];
  const day=now.toISOString().slice(0,10);
  const selected=gaps.flatMap(result=>result.missing
    .filter(g=>g.priority==='Hög')
    .map(g=>({result,g})))
    .slice(0,Math.max(0,maxQueries));

  for(const {result,g} of selected){
    const ctx=context.get(result.timelineId)??{competitors:[],geographies:[]};
    const built=queryForGap(g.id,result.headline,ctx.competitors,ctx.geographies);
    queue.push({
      jobId:`${day}:gap:${result.timelineId}:${g.id}`,
      targetId:`gap:${g.id}:${result.timelineId}`,
      targetName:`Gap discovery – ${g.label}`,
      county:null,
      intent:'source-gap',
      query:built.query,
      allowedHosts:built.hosts.length?built.hosts:undefined,
      sourceClass:built.sourceClass,
    });
  }

  return {
    queue,
    selectedGaps:selected.length,
    casesCovered:new Set(selected.map(x=>x.result.timelineId)).size,
    maxQueries,
    budgetMode:'bounded-second-pass',
    note:'Queries are generated only from high-priority evidence gaps. Results are supplemental discovery and do not silently rewrite the current fusion in the same pass.',
  };
}
