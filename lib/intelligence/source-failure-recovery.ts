import type { WatchSource } from './sources';
import type { SourceCandidate } from './adapters';
import {
  discoverDeclaredFeedUrls, discoverDeclaredSitemapUrls, extractFeedCandidates,
  extractRobotsSitemaps, extractSitemapCandidates, extractSitemapIndexUrls, uniqueCandidates,
} from './feed-sitemap-discovery';

export type ListingFetchResult = {html:string;finalUrl:string;status:number;contentType:string;};

export type SourceRecoveryDiagnostics = {
  primaryAttempted:boolean; primaryOk:boolean; retryAttempted:boolean; retryOk:boolean;
  baseFallbackAttempted:boolean; baseFallbackOk:boolean;
  feedDiscoveryAttempted:boolean; feedDiscovered:boolean; feedFetchOk:boolean; feedCandidates:number;
  sitemapDiscoveryAttempted:boolean; sitemapDiscovered:boolean; sitemapFetchOk:boolean; sitemapCandidates:number;
  robotsChecked:boolean; sitemapIndexFollowed:number; structuredRequests:number;
  structuredCompetitorCandidatesPromoted:number;
  recoveryMode:'none'|'retry'|'base'|'feed'|'sitemap'|'structured'; recovered:boolean; error:string|null;
};

export type RecoveredSourceListing = {document:ListingFetchResult|null;feedCandidates:SourceCandidate[];sitemapCandidates:SourceCandidate[];diagnostics:SourceRecoveryDiagnostics;};
type FetchDocument = (url:string,timeoutMs?:number)=>Promise<ListingFetchResult>;

function isTransient(error:unknown){const message=error instanceof Error?error.message:String(error??'');return /HTTP (408|425|429|500|502|503|504)|timeout|timed out|fetch failed|ECONNRESET|ENOTFOUND/i.test(message);}
function sameOrigin(a:string,b:string){try{return new URL(a).origin===new URL(b).origin;}catch{return false;}}
function escapeHtml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function structuredCandidateMarkup(items:SourceCandidate[]){return items.map(item=>`<a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a>`).join('\n');}

export async function fetchSourceListingWithRecovery(input:{source:WatchSource;fetchDocument:FetchDocument;candidateCount:(html:string)=>number;}):Promise<RecoveredSourceListing>{
  const {source,fetchDocument,candidateCount}=input;
  const diagnostics:SourceRecoveryDiagnostics={
    primaryAttempted:true,primaryOk:false,retryAttempted:false,retryOk:false,baseFallbackAttempted:false,baseFallbackOk:false,
    feedDiscoveryAttempted:false,feedDiscovered:false,feedFetchOk:false,feedCandidates:0,
    sitemapDiscoveryAttempted:false,sitemapDiscovered:false,sitemapFetchOk:false,sitemapCandidates:0,
    robotsChecked:false,sitemapIndexFollowed:0,structuredRequests:0,structuredCompetitorCandidatesPromoted:0,recoveryMode:'none',recovered:false,error:null,
  };
  let document:ListingFetchResult|null=null;
  try{document=await fetchDocument(source.listingUrl,9000);diagnostics.primaryOk=true;}
  catch(error){
    diagnostics.error=error instanceof Error?error.message:'Okänt fel';
    if(isTransient(error)){
      diagnostics.retryAttempted=true;
      try{document=await fetchDocument(source.listingUrl,12000);diagnostics.retryOk=true;diagnostics.recoveryMode='retry';diagnostics.recovered=true;diagnostics.error=null;}
      catch(retryError){diagnostics.error=retryError instanceof Error?retryError.message:'Okänt fel';}
    }
    if(!document&&source.baseUrl&&source.baseUrl!==source.listingUrl){
      diagnostics.baseFallbackAttempted=true;
      try{document=await fetchDocument(source.baseUrl,9000);diagnostics.baseFallbackOk=true;diagnostics.recoveryMode='base';diagnostics.recovered=true;diagnostics.error=null;}
      catch(baseError){diagnostics.error=baseError instanceof Error?baseError.message:'Okänt fel';}
    }
  }

  let feedCandidates:SourceCandidate[]=[]; let sitemapCandidates:SourceCandidate[]=[];
  // Structured discovery is deliberately bounded and only supplements weak listing pages.
  if(document&&/html/i.test(document.contentType||'text/html')&&candidateCount(document.html)<5){
    diagnostics.feedDiscoveryAttempted=true;
    const feedUrls=discoverDeclaredFeedUrls(document.html,document.finalUrl||source.listingUrl);
    diagnostics.feedDiscovered=feedUrls.length>0;
    for(const feedUrl of feedUrls.slice(0,1)){
      try{diagnostics.structuredRequests++;const feed=await fetchDocument(feedUrl,8000);feedCandidates=extractFeedCandidates(feed.html,feed.finalUrl||feedUrl);diagnostics.feedFetchOk=true;}catch{}
    }
    diagnostics.feedCandidates=feedCandidates.length;

    diagnostics.sitemapDiscoveryAttempted=true;
    let sitemapUrls=discoverDeclaredSitemapUrls(document.html,document.finalUrl||source.listingUrl);
    if(sitemapUrls.length===0&&source.baseUrl){
      try{
        const robotsUrl=new URL('/robots.txt',source.baseUrl).toString(); diagnostics.robotsChecked=true; diagnostics.structuredRequests++;
        const robots=await fetchDocument(robotsUrl,6000); sitemapUrls=extractRobotsSitemaps(robots.html,robots.finalUrl||robotsUrl).filter(x=>sameOrigin(x,source.baseUrl!));
      }catch{}
    }
    diagnostics.sitemapDiscovered=sitemapUrls.length>0;
    const collected:SourceCandidate[]=[];
    for(const sitemapUrl of sitemapUrls.slice(0,1)){
      try{
        diagnostics.structuredRequests++; const map=await fetchDocument(sitemapUrl,8000); diagnostics.sitemapFetchOk=true;
        collected.push(...extractSitemapCandidates(map.html,map.finalUrl||sitemapUrl));
        const children=extractSitemapIndexUrls(map.html,map.finalUrl||sitemapUrl).filter(x=>sameOrigin(x,source.baseUrl||source.listingUrl));
        for(const child of children.slice(0,2)){
          try{diagnostics.structuredRequests++;const nested=await fetchDocument(child,7000);collected.push(...extractSitemapCandidates(nested.html,nested.finalUrl||child));diagnostics.sitemapIndexFollowed++;}catch{}
        }
      }catch{}
    }
    sitemapCandidates=uniqueCandidates(collected,100); diagnostics.sitemapCandidates=sitemapCandidates.length;
    if(feedCandidates.length||sitemapCandidates.length){diagnostics.recovered=true;diagnostics.recoveryMode=feedCandidates.length&&sitemapCandidates.length?'structured':sitemapCandidates.length?'sitemap':'feed';}

    // Competitor-owned sources are already allowlisted and constrained by the adapter's news-like path rules.
    // Preserve RSS/sitemap recovery candidates in the listing document so the ordinary competitor adapter can
    // evaluate them without requiring a generic waste keyword in the headline. Downstream article validation,
    // date, quality and relevance gates still decide whether the item reaches the feed.
    if(source.type==='competitor'){
      const promoted=uniqueCandidates([...feedCandidates,...sitemapCandidates],100);
      if(promoted.length){
        document={...document,html:`${document.html}\n${structuredCandidateMarkup(promoted)}`};
        diagnostics.structuredCompetitorCandidatesPromoted=promoted.length;
      }
    }
  }
  return {document,feedCandidates,sitemapCandidates,diagnostics};
}
