import type { WatchSource } from './sources';

export type DiversityDimension='source-class'|'geography'|'theme'|'provenance';
export type SourceDiversityProfile={sourceClass:string;geographies:string[];themes:string[];provenance:string};
export type BlindSpot={dimension:DiversityDimension;key:string;severity:'high'|'medium';reason:string};
export type SourceDiversityReport={coverageScore:number;missingSourceClasses:string[];underCoveredThemes:string[];underCoveredGeographies:string[];provenanceBalance:Record<string,number>;blindSpots:BlindSpot[];recommendedExploration:string[];profiles:Record<string,SourceDiversityProfile>};

const desiredClasses=['authority','industry','media','competitor/company','procurement','research','EU/international'];
const desiredThemes=['contracts/awards','capacity/facilities','permits/environment','planning/land','M&A','investment','pricing/material flows','jobs','legal/regulatory'];
const desiredGeographies=['nationell','Stockholm','Göteborg','Malmö','Örebro'];
const norm=(s:string)=>s.toLocaleLowerCase('sv-SE');

export function profileSource(source:WatchSource):SourceDiversityProfile{
  const hay=norm(`${source.id} ${source.name} ${source.listingUrl} ${source.description??''}`);
  const sourceClass=source.type==='company'||source.type==='competitor'?'competitor/company':source.type==='eu'?'EU/international':source.type;
  const geographies:string[]=[];
  if(source.scope==='sweden')geographies.push('nationell');
  for(const [label,terms] of Object.entries({Stockholm:['stockholm'],Göteborg:['göteborg','goteborg','väst','vastra-gotaland'],Malmö:['malmö','malmo','skåne','skane'],Örebro:['örebro','orebro']})) if(terms.some(t=>hay.includes(t)))geographies.push(label);
  const themes:string[]=[];
  const rules:Record<string,string[]>={
    'contracts/awards':['upphandling','tilldel','kontrakt','avtal'], 'capacity/facilities':['anlägg','kapacitet','deponi','drift'],
    'permits/environment':['miljötillstånd','miljöpröv','kungörelse','utsläpp'], 'planning/land':['detaljplan','bygglov','markköp','etabler'],
    'M&A':['förvärv','fusion','acquisition'], investment:['investering','finansier'], 'pricing/material flows':['pris','kostnad','material','statistik'],
    jobs:['jobb','karriär','rekryter'], 'legal/regulatory':['domstol','lag','regler','myndighet','riksdag','regering']};
  for(const [theme,terms] of Object.entries(rules))if(terms.some(t=>hay.includes(t)))themes.push(theme);
  const provenance=source.type==='authority'||source.type==='procurement'||source.type==='eu'?'authority':source.type==='media'?'independent journalism':source.type==='industry'?'industry journalism':source.type==='company'||source.type==='competitor'?'competitor-owned':'official original';
  return {sourceClass,geographies:[...new Set(geographies)],themes,provenance};
}

export function assessSourceDiversity(sources:WatchSource[]):SourceDiversityReport{
  const enabled=sources.filter(s=>s.enabled); const profiles=Object.fromEntries(enabled.map(s=>[s.id,profileSource(s)]));
  const count=(values:string[],key:string)=>values.filter(v=>v===key).length;
  const classes=Object.values(profiles).map(p=>p.sourceClass); const themes=Object.values(profiles).flatMap(p=>p.themes); const geos=Object.values(profiles).flatMap(p=>p.geographies);
  // Multiple regional editions from the same publisher improve geographic reach, but must not manufacture provenance diversity.
  const provenanceKeys=new Set<string>();
  for(const source of enabled){
    const p=profiles[source.id];
    provenanceKeys.add(`${p.provenance}:${source.publisherGroup??source.id}`);
  }
  const prov=[...provenanceKeys].map(x=>x.split(':',1)[0]);
  const missingSourceClasses=desiredClasses.filter(x=>count(classes,x)===0);
  const underCoveredThemes=desiredThemes.filter(x=>count(themes,x)<2);
  const underCoveredGeographies=desiredGeographies.filter(x=>count(geos,x)<2);
  const provenanceBalance=Object.fromEntries([...new Set(prov)].map(x=>[x,count(prov,x)]));
  const blindSpots:BlindSpot[]=[];
  for(const key of missingSourceClasses)blindSpots.push({dimension:'source-class',key,severity:'high',reason:`Ingen observerad aktiv källa i källklassen ${key}.`});
  for(const key of underCoveredThemes)blindSpots.push({dimension:'theme',key,severity:count(themes,key)===0?'high':'medium',reason:`Låg observerad källtäckning för ${key}.`});
  for(const key of underCoveredGeographies)blindSpots.push({dimension:'geography',key,severity:count(geos,key)===0?'high':'medium',reason:`Låg observerad källtäckning i ${key}.`});
  if(!provenanceBalance['independent journalism'])blindSpots.push({dimension:'provenance',key:'independent journalism',severity:'high',reason:'Saknar observerad oberoende redaktionell källtäckning.'});
  const classCoverage=(desiredClasses.length-missingSourceClasses.length)/desiredClasses.length;
  const themeCoverage=(desiredThemes.length-underCoveredThemes.filter(x=>count(themes,x)===0).length)/desiredThemes.length;
  const geoCoverage=(desiredGeographies.length-underCoveredGeographies.filter(x=>count(geos,x)===0).length)/desiredGeographies.length;
  const provenanceCoverage=Math.min(1,Object.keys(provenanceBalance).length/4);
  const coverageScore=Math.round((classCoverage*.3+themeCoverage*.3+geoCoverage*.2+provenanceCoverage*.2)*100);
  const recommendedExploration=blindSpots.slice(0,6).map(b=>`Utforska fler ${b.dimension==='geography'?'lokala/regionala källor i ':b.dimension==='theme'?'källor för ':''}${b.key}`);
  return {coverageScore,missingSourceClasses,underCoveredThemes,underCoveredGeographies,provenanceBalance,blindSpots,recommendedExploration,profiles};
}

export function diversityExplorationBonus(source:WatchSource,report:SourceDiversityReport){
  const p=report.profiles[source.id]??profileSource(source); let bonus=0; const reasons:string[]=[];
  if(report.missingSourceClasses.includes(p.sourceClass)){bonus+=8;reasons.push(`underrepresenterad källklass: ${p.sourceClass}`);}
  const geo=p.geographies.find(x=>report.underCoveredGeographies.includes(x)); if(geo){bonus+=5;reasons.push(`underrepresenterad geografi: ${geo}`);}
  const theme=p.themes.find(x=>report.underCoveredThemes.includes(x)); if(theme){bonus+=4;reasons.push(`underrepresenterat tema: ${theme}`);}
  if(p.provenance==='independent journalism'&&!report.provenanceBalance['independent journalism']){bonus+=6;reasons.push('saknad oberoende redaktionell täckning');}
  return {bonus:Math.min(12,bonus),reasons};
}
