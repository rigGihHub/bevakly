import { canonicalizeCompetitorName } from './entities';
export type CompetitorSourceCheck={id:string;name:string;competitorName?:string;ok:boolean;error?:string|null;articleChecks?:number;articleFailures?:number};
export function competitorCoverageStatus(actor:string,sources:CompetitorSourceCheck[],items:{competitors?:string[]}[],fetchedAt?:string){
 const norm=(s:string)=>canonicalizeCompetitorName(s).toLocaleLowerCase('sv-SE');
 const checks=sources.filter(s=>s.competitorName?norm(s.competitorName)===norm(actor):norm(s.name).includes(norm(actor)));
 const hits=items.filter(i=>(i.competitors??[]).some(c=>norm(c)===norm(actor))).length;
 const failed=checks.filter(s=>!s.ok||(s.articleFailures??0)>0);
 const healthy=checks.filter(s=>s.ok);
 const lastSuccessfulCheck=healthy.length?fetchedAt:undefined;
 const label=!checks.length?'Ingen direktkälla kontrollerad':failed.length?'Ofullständig kontroll':hits?'Nyheter hittade':checks.some(s=>(s.articleChecks??0)>0)?'Inga godkända nyheter i lästa artiklar':'Källsidan nådd – artikeltäckning ej verifierad';
 return {actor,hits,label,lastSuccessfulCheck,checkedSources:checks.length,failedSources:failed.length,sources:checks};
}
