import type { WatchSource } from './sources';

export type CoverageLevel='bra'|'medel'|'svag'|'okänd';
export type CoverageDimension='procurement'|'permits'|'media'|'competitors'|'facilities';
export type CoverageItem={title:string;category:string;factualSummary?:string;geographies?:string[];competitors?:string[]};
export type CoverageSourceStatus={id:string;ok:boolean;hits:number;runHealth?:'healthy'|'low-yield'|'failed'};
export type CountyCoverage={county:string;overall:CoverageLevel;score:number;dimensions:Record<CoverageDimension,{level:CoverageLevel;score:number;signals:number;regionalSources:number;healthyRegionalSources:number}>;reasons:string[]};

export const SWEDISH_COUNTIES=['Blekinge','Dalarna','Gotland','Gävleborg','Halland','Jämtland','Jönköping','Kalmar','Kronoberg','Norrbotten','Skåne','Stockholm','Södermanland','Uppsala','Värmland','Västerbotten','Västernorrland','Västmanland','Västra Götaland','Örebro','Östergötland'] as const;
const dims:CoverageDimension[]=['procurement','permits','media','competitors','facilities'];
const terms:Record<Exclude<CoverageDimension,'media'>,string[]>={
 procurement:['upphandling','tilldelning','kontrakt','avtal','entrepren','rfi','marknadsdialog','option','förlängning'],
 permits:['tillstånd','miljöpröv','samråd','kungörelse','överpröv','domstol'],
 competitors:['prezero','ragn-sells','stena recycling','remondis','verdis','ohlssons','konkurrent'],
 facilities:['anläggning','kapacitet','omlastning','återvinningscentral','deponi','förbränning','driftstart','byggstart','investering']
};
function norm(s:string){return s.toLocaleLowerCase('sv-SE')}
function itemInCounty(item:CoverageItem,county:string){return (item.geographies??[]).some(g=>norm(g).includes(norm(county)));}
function signalMatch(item:CoverageItem,dim:Exclude<CoverageDimension,'media'>){const hay=norm(`${item.title} ${item.category} ${item.factualSummary??''} ${(item.competitors??[]).join(' ')}`);return terms[dim].some(t=>hay.includes(t));}
function level(score:number,evidence:boolean):CoverageLevel{if(!evidence)return'okänd';return score>=70?'bra':score>=42?'medel':'svag'}
function avg(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0}

export function buildSwedishCoverageGapMatrix(sources:WatchSource[],statuses:CoverageSourceStatus[],items:CoverageItem[]):CountyCoverage[]{
 const status=new Map(statuses.map(x=>[x.id,x]));
 return SWEDISH_COUNTIES.map(county=>{
   const regional=sources.filter(s=>s.enabled&&s.scope==='sweden'&&(s.regions??[]).some(r=>norm(r)===norm(county)));
   const healthy=regional.filter(s=>status.get(s.id)?.ok!==false);
   const regionalMedia=regional.filter(s=>s.type==='media');
   const healthyMedia=healthy.filter(s=>s.type==='media');
   const countyItems=items.filter(i=>itemInCounty(i,county));
   const dimensions={} as CountyCoverage['dimensions'];
   for(const dim of dims){
     if(dim==='media'){
       const configured=regionalMedia.length, healthyCount=healthyMedia.length;
       const producing=healthyMedia.filter(s=>(status.get(s.id)?.hits??0)>0).length;
       const score=Math.min(100,configured*34+healthyCount*24+producing*18);
       dimensions[dim]={level:level(score,configured>0),score,signals:producing,regionalSources:configured,healthyRegionalSources:healthyCount};
       continue;
     }
     const signals=countyItems.filter(i=>signalMatch(i,dim)).length;
     const relatedSources=regional.filter(s=>dim==='competitors'?s.type==='competitor':dim==='procurement'?s.type==='procurement':s.type==='authority'||s.type==='company');
     const healthyRelated=relatedSources.filter(s=>status.get(s.id)?.ok!==false);
     // Signals matter most, but configured regional sources provide only modest support: configured != verified coverage.
     const score=Math.min(100,signals*24+healthyRelated.length*12+relatedSources.length*6);
     dimensions[dim]={level:level(score,signals>0||relatedSources.length>0),score,signals,regionalSources:relatedSources.length,healthyRegionalSources:healthyRelated.length};
   }
   const known=Object.values(dimensions).filter(x=>x.level!=='okänd');
   const score=Math.round(avg(known.map(x=>x.score)));
   const overall=known.length<2?'okänd':level(score,true);
   const weak=Object.entries(dimensions).filter(([,v])=>v.level==='svag'||v.level==='okänd').map(([k])=>k);
   const reasons=[`${regional.length} explicit regional source${regional.length===1?'':'s'} configured; ${healthy.length} answered in the latest run.`,`${countyItems.length} accepted items in the current evidence window.`,weak.length?`Weak/unknown dimensions: ${weak.join(', ')}.`:'No weak dimension in the current matrix.'];
   return {county,overall,score,dimensions,reasons};
 }).sort((a,b)=>a.score-b.score||a.county.localeCompare(b.county,'sv'));
}

export function summarizeSwedishCoverageGapMatrix(rows:CountyCoverage[]){
 return {counties:rows.length,good:rows.filter(x=>x.overall==='bra').length,medium:rows.filter(x=>x.overall==='medel').length,weak:rows.filter(x=>x.overall==='svag').length,unknown:rows.filter(x=>x.overall==='okänd').length,priorityGaps:rows.filter(x=>x.overall==='svag'||x.overall==='okänd').slice(0,6).map(x=>({county:x.county,overall:x.overall,score:x.score,weakDimensions:Object.entries(x.dimensions).filter(([,v])=>v.level==='svag'||v.level==='okänd').map(([k])=>k)})),principle:'Coverage score describes Bevakly’s observed/configured source universe, not the real market. A quiet county is not automatically a blind spot and coverage never increases evidence confidence.'};
}
