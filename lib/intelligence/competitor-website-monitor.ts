import { createHash } from 'node:crypto';

export type VerifiedCompetitorPage={competitor:string;pageType:'homepage'|'careers';url:string;hosts:string[]};
export type WebsiteChange={id:string;competitor:string;pageType:'homepage'|'careers';url:string;detectedAt:string;changeType:'first-baseline'|'content-change';changeRatio:number;importance:'low'|'medium'|'high';beforeHash:string|null;afterHash:string;addedTerms:string[];removedTerms:string[];summary:string};
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
const strategicTerms=['ny anläggning','etablering','expanderar','investering','kapacitet','förvärv','ny tjänst','nytt erbjudande','produktionschef','platschef','account manager','kommande uppdrag','hållbarhet','återvinning','cirkulär'];

function normalizeHtml(html:string){
 return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim().slice(0,120000);
}
function hash(text:string){return createHash('sha256').update(text).digest('hex');}
function terms(text:string){const lower=text.toLocaleLowerCase('sv-SE');return strategicTerms.filter(x=>lower.includes(x));}
function ratio(a:string,b:string){if(!a&&!b)return 0;const aw=new Set(a.toLocaleLowerCase('sv-SE').split(/\s+/).filter(Boolean));const bw=new Set(b.toLocaleLowerCase('sv-SE').split(/\s+/).filter(Boolean));let same=0;for(const w of aw)if(bw.has(w))same++;const union=new Set([...aw,...bw]).size;return union?Number((1-same/union).toFixed(3)):0;}
function importance(changeRatio:number,added:string[],removed:string[]){if((added.length+removed.length)>=3||changeRatio>=.35)return 'high' as const;if(added.length+removed.length||changeRatio>=.12)return 'medium' as const;return 'low' as const;}

export async function monitorCompetitorWebsites(now=new Date(),maxPages=6):Promise<{changes:WebsiteChange[];diagnostics:{checked:number;failed:number;baselinesCreated:number;changesDetected:number;persistence:'process-local';verifiedPages:number}}>{
 const changes:WebsiteChange[]=[];let checked=0,failed=0,baselinesCreated=0,changesDetected=0;
 const day=now.toISOString().slice(0,10);
 const ordered=[...verifiedCompetitorPages].sort((a,b)=>hash(`${day}|${a.competitor}|${a.pageType}`).localeCompare(hash(`${day}|${b.competitor}|${b.pageType}`)));
 for(const page of ordered.slice(0,Math.max(0,Math.min(verifiedCompetitorPages.length,maxPages)))){
  try{
   const u=new URL(page.url);if(!page.hosts.includes(u.hostname))throw new Error('host-not-allowed');
   const r=await fetch(page.url,{headers:{'user-agent':'Bevakly/2.55 website-change-monitor','accept':'text/html'},redirect:'follow',signal:AbortSignal.timeout(6500)});
   if(!r.ok)throw new Error(`HTTP ${r.status}`);
   const finalHost=new URL(r.url).hostname;if(!page.hosts.includes(finalHost))throw new Error('redirect-host-not-allowed');
   const text=normalizeHtml(await r.text());if(text.length<120)throw new Error('content-too-short');
   checked++;const key=`${page.competitor}|${page.pageType}|${page.url}`;const afterHash=hash(text);const previous=snapshots.get(key);
   if(!previous){snapshots.set(key,{hash:afterHash,text,capturedAt:now.toISOString()});baselinesCreated++;continue;}
   if(previous.hash===afterHash)continue;
   const beforeTerms=terms(previous.text),afterTerms=terms(text);const addedTerms=afterTerms.filter(x=>!beforeTerms.includes(x)),removedTerms=beforeTerms.filter(x=>!afterTerms.includes(x));const changeRatio=ratio(previous.text,text);const imp=importance(changeRatio,addedTerms,removedTerms);
   changes.push({id:`webchange-${hash(`${key}|${afterHash}`).slice(0,16)}`,competitor:page.competitor,pageType:page.pageType,url:page.url,detectedAt:now.toISOString(),changeType:'content-change',changeRatio,importance:imp,beforeHash:previous.hash,afterHash,addedTerms,removedTerms,summary:`${page.competitor} har ändrat sin ${page.pageType==='careers'?'karriärsida':'webbplats'}. ${addedTerms.length?`Nya strategiska termer: ${addedTerms.join(', ')}.`:'Ingen ny strategisk term identifierad.'}`});
   snapshots.set(key,{hash:afterHash,text,capturedAt:now.toISOString()});changesDetected++;
  }catch{failed++;}
 }
 return {changes:changes.sort((a,b)=>({high:3,medium:2,low:1}[b.importance]-{high:3,medium:2,low:1}[a.importance])),diagnostics:{checked,failed,baselinesCreated,changesDetected,persistence:'process-local',verifiedPages:verifiedCompetitorPages.length}};
}
