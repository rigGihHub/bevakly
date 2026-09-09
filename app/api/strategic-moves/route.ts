import { createHash } from 'node:crypto';

export type VerifiedCompetitorPage={competitor:string;pageType:'homepage'|'careers';url:string;hosts:string[]};
export type WebsiteChangeDimension='capacity'|'services'|'geography'|'jobs'|'investment'|'pricing'|'m-and-a'|'permits'|'other';
export type WebsiteChange={id:string;competitor:string;pageType:'homepage'|'careers';url:string;detectedAt:string;changeType:'content-change';changeRatio:number;importance:'low'|'medium'|'high';beforeHash:string;afterHash:string;addedTerms:string[];removedTerms:string[];addedSnippets:string[];removedSnippets:string[];dimensions:WebsiteChangeDimension[];summary:string;assessment:string;caseLink:{status:'candidate'|'none';reason:string};guardrail:string};
type Snapshot={hash:string;text:string;capturedAt:string};

export const verifiedCompetitorPages:VerifiedCompetitorPage[]=[
 {competitor:'PreZero',pageType:'homepage',url:'https://www.prezero.se/',hosts:['prezero.se','www.prezero.se']},
 {competitor:'PreZero',pageType:'careers',url:'https://jobs.prezero.se/lediga-tjaenster-paa-prezero',hosts:['jobs.prezero.se']},
 {competitor:'Ragn-Sells',pageType:'homepage',url:'https://www.ragnsells.se/',hosts:['ragnsells.se','www.ragnsells.se']},
 {competitor:'Ragn-Sells',pageType:'careers',url:'https://www.ragnsells.se/om-oss/karriar/lediga-tjanster/',hosts:['ragnsells.se','www.ragnsells.se']},
 {competitor:'Stena Recycling',pageType:'homepage',url:'https://www.stenarecycling.com/sv/',hosts:['stenarecycling.com','www.stenarecycling.com']},
 {competitor:'Stena Recycling',pageType:'careers',url:'https://www.stenarecycling.com/sv/karriar/lediga-tjanster/',hosts:['stenarecycling.com','www.stenarecycling.com']},
 {competitor:'REMONDIS',pageType:'homepage',url:'https://www.remondis.se/',hosts:['remondis.se','www.remondis.se']},
 {competitor:'REMONDIS',pageType:'careers',url:'https://jobb.remondis.se/jobs',hosts:['jobb.remondis.se']},
 {competitor:'Verdis',pageType:'homepage',url:'https://www.verdis.se/',hosts:['verdis.se','www.verdis.se']},
 {competitor:'Verdis',pageType:'careers',url:'https://www.verdis.se/bli-en-av-oss/lediga-jobb/',hosts:['verdis.se','www.verdis.se']},
];

const snapshots=new Map<string,Snapshot>();
const dimensionTerms:Record<WebsiteChangeDimension,string[]>={
 capacity:['anläggning','kapacitet','terminal','sortering','behandling','produktionslinje'],
 services:['ny tjänst','nytt erbjudande','insamling','återvinningstjänst','behandlingstjänst'],
 geography:['etablering','etablerar','ny ort','region','kommun'],
 jobs:['produktionschef','platschef','driftchef','account manager','rekryterar','lediga tjänster'],
 investment:['investering','investerar','miljoner','miljarder'],
 pricing:['prisjustering','prisförändring','behandlingsavgift','indexering'],
 'm-and-a':['förvärv','förvärvar','fusion','köper','försäljning av bolag'],
 permits:['miljötillstånd','tillstånd','samråd','bygglov'],
 other:['hållbarhet','cirkulär']
};
const strategicTerms=[...new Set(Object.values(dimensionTerms).flat())];

export function normalizeWebsiteHtml(html:string){
 return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().slice(0,120000);
}
function hash(text:string){return createHash('sha256').update(text).digest('hex');}
function terms(text:string){const lower=text.toLocaleLowerCase('sv-SE');return strategicTerms.filter(x=>lower.includes(x));}
function tokens(text:string){return text.toLocaleLowerCase('sv-SE').split(/(?<=[.!?])\s+|\s*[|•]\s*/).map(x=>x.trim()).filter(x=>x.length>=18&&x.length<=360);}
function signature(x:string){return x.replace(/\s+/g,' ').replace(/\b\d{1,2}[:.]\d{2}\b/g,'<time>').replace(/\b\d+\b/g,'<n>').trim();}
export function extractWebsiteDiff(before:string,after:string){
 const b=new Map(tokens(before).map(x=>[signature(x),x])),a=new Map(tokens(after).map(x=>[signature(x),x]));
 const added=[...a].filter(([k])=>!b.has(k)).map(([,v])=>v).slice(0,5);
 const removed=[...b].filter(([k])=>!a.has(k)).map(([,v])=>v).slice(0,5);
 return {added,removed};
}
export function classifyWebsiteChange(text:string):WebsiteChangeDimension[]{
 const l=text.toLocaleLowerCase('sv-SE');
 return (Object.entries(dimensionTerms) as [WebsiteChangeDimension,string[]][]).filter(([,xs])=>xs.some(x=>l.includes(x))).map(([k])=>k);
}
function ratio(a:string,b:string){if(!a&&!b)return 0;const A=new Set(a.toLowerCase().split(/\s+/)),B=new Set(b.toLowerCase().split(/\s+/));const union=new Set([...A,...B]);let diff=0;for(const x of union)if(A.has(x)!==B.has(x))diff++;return union.size?diff/union.size:0;}
function importance(changeRatio:number,dims:WebsiteChangeDimension[],added:string[]){if(dims.some(x=>['capacity','investment','m-and-a','permits','pricing'].includes(x))&&added.length)return 'high' as const;if(dims.length||changeRatio>=.12)return 'medium' as const;return 'low' as const;}
export function analyzeWebsiteChange(before:string,after:string){
 const beforeTerms=terms(before),afterTerms=terms(after),addedTerms=afterTerms.filter(x=>!beforeTerms.includes(x)),removedTerms=beforeTerms.filter(x=>!afterTerms.includes(x));
 const diff=extractWebsiteDiff(before,after);const dimensions=classifyWebsiteChange([...diff.added,...diff.removed].join(' '));const changeRatio=ratio(before,after);
 return {changeRatio,addedTerms,removedTerms,addedSnippets:diff.added,removedSnippets:diff.removed,dimensions,importance:importance(changeRatio,dimensions,diff.added)};
}
export function resetWebsiteMonitorForQa(){snapshots.clear();}

export async function monitorCompetitorWebsites(now=new Date(),maxPages=6):Promise<{changes:WebsiteChange[];diagnostics:{checked:number;failed:number;baselinesCreated:number;changesDetected:number;persistence:'process-local';verifiedPages:number;version:'2.0'}}>{
 const changes:WebsiteChange[]=[];let checked=0,failed=0,baselinesCreated=0,changesDetected=0;
 const day=now.toISOString().slice(0,10);const ordered=[...verifiedCompetitorPages].sort((a,b)=>hash(`${day}|${a.competitor}|${a.pageType}`).localeCompare(hash(`${day}|${b.competitor}|${b.pageType}`)));
 for(const page of ordered.slice(0,Math.max(0,Math.min(verifiedCompetitorPages.length,maxPages)))){
  try{
   const u=new URL(page.url);if(!page.hosts.includes(u.hostname))throw new Error('host-not-allowed');
   const r=await fetch(page.url,{headers:{'user-agent':'Bevakly/2.93 website-change-monitor','accept':'text/html'},redirect:'follow',signal:AbortSignal.timeout(6500)});if(!r.ok)throw new Error(`HTTP ${r.status}`);
   const finalHost=new URL(r.url).hostname;if(!page.hosts.includes(finalHost))throw new Error('redirect-host-not-allowed');
   const text=normalizeWebsiteHtml(await r.text());if(text.length<120)throw new Error('content-too-short');checked++;
   const key=`${page.competitor}|${page.pageType}|${page.url}`,afterHash=hash(text),previous=snapshots.get(key);
   if(!previous){snapshots.set(key,{hash:afterHash,text,capturedAt:now.toISOString()});baselinesCreated++;continue;} if(previous.hash===afterHash)continue;
   const a=analyzeWebsiteChange(previous.text,text);const meaningful=a.addedSnippets.length>0||a.removedSnippets.length>0;
   snapshots.set(key,{hash:afterHash,text,capturedAt:now.toISOString()});if(!meaningful)continue;
   const assessment=a.dimensions.length?`Observerad webbändring berör ${a.dimensions.join(', ')}. Detta är en förändringssignal, inte bevis för ändrad strategi.`:'Webbplatsen ändrades, men ingen strategisk dimension kunde verifieras.';
   changes.push({id:`webchange-${hash(`${key}|${afterHash}`).slice(0,16)}`,competitor:page.competitor,pageType:page.pageType,url:page.url,detectedAt:now.toISOString(),changeType:'content-change',beforeHash:previous.hash,afterHash,...a,summary:`${page.competitor}: ${a.addedSnippets.length} tillagt och ${a.removedSnippets.length} borttaget textstycke identifierat.`,assessment,caseLink:{status:'candidate',reason:'Kan jämföras med befintliga case först när gemensam identitet/evidens finns.'},guardrail:'Webbändring ≠ verklig marknadshändelse. Dynamiskt sidbrus och redaktionella ändringar kan förekomma.'});changesDetected++;
  }catch{failed++}
 }
 return {changes,diagnostics:{checked,failed,baselinesCreated,changesDetected,persistence:'process-local',verifiedPages:verifiedCompetitorPages.length,version:'2.0'}};
}
