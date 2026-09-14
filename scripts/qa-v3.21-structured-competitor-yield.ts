import assert from 'node:assert/strict';
import { fetchSourceListingWithRecovery, type ListingFetchResult } from '../lib/intelligence/source-failure-recovery.ts';
import type { WatchSource } from '../lib/intelligence/sources.ts';

const competitor:WatchSource={id:'c',name:'Konkurrent',listingUrl:'https://example.com/nyheter',baseUrl:'https://example.com',type:'competitor',scope:'sweden',tier:2,trustScore:82,enabled:true,competitorName:'Konkurrent'};
const media:WatchSource={...competitor,id:'m',name:'Media',type:'media',competitorName:undefined};
const listing=`<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head><body>${Array.from({length:8},(_,i)=>`<a href="/nyheter/avfall-${i}">Avfall nyhet ${i}</a>`).join('')}</body></html>`;
const feed=`<?xml version="1.0"?><rss version="2.0"><channel><item><title>Ny vd för svenska verksamheten</title><link>https://example.com/nyheter/ny-vd</link></item></channel></rss>`;
async function fakeFetch(url:string):Promise<ListingFetchResult>{if(url.endsWith('/nyheter'))return {html:listing,finalUrl:url,status:200,contentType:'text/html'};if(url.endsWith('/feed.xml'))return {html:feed,finalUrl:url,status:200,contentType:'application/rss+xml'};throw new Error('HTTP 404')}

const richCount=()=>8;
const c=await fetchSourceListingWithRecovery({source:competitor,fetchDocument:fakeFetch,candidateCount:richCount});
assert.equal(c.diagnostics.feedDiscoveryAttempted,true,'konkurrentkälla ska probe:a deklarerad feed även när listningen är rik');
assert.equal(c.diagnostics.feedCandidates,1);
assert.equal(c.diagnostics.structuredCompetitorCandidatesPromoted,1);
assert.match(c.document?.html??'',/Ny vd för svenska verksamheten/);
assert.equal(c.diagnostics.sitemapDiscoveryAttempted,false,'rik listning ska inte utlösa extra sitemap-crawl');

const m=await fetchSourceListingWithRecovery({source:media,fetchDocument:fakeFetch,candidateCount:richCount});
assert.equal(m.diagnostics.feedDiscoveryAttempted,false,'vanlig mediakälla med rik listning ska inte få extra crawl-budget');
assert.equal(m.diagnostics.structuredCompetitorCandidatesPromoted,0);
console.log('v3.21 structured competitor yield: PASS');
