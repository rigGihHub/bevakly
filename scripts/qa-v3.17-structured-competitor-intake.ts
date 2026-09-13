import assert from 'node:assert/strict';
import { fetchSourceListingWithRecovery, type ListingFetchResult } from '../lib/intelligence/source-failure-recovery.ts';
import type { WatchSource } from '../lib/intelligence/sources.ts';

const competitor:WatchSource={
  id:'test-competitor',name:'Testbolaget',listingUrl:'https://example.com/nyheter',baseUrl:'https://example.com',
  type:'competitor',scope:'sweden',tier:1,trustScore:95,enabled:true,competitorName:'Testbolaget'
};
const media:WatchSource={...competitor,id:'test-media',name:'Testmedia',type:'media'};

const listing=`<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head><body><p>Nyheter</p></body></html>`;
const feed=`<?xml version="1.0"?><rss version="2.0"><channel><item><title>Ny vd för svenska verksamheten</title><link>https://example.com/nyheter/ny-vd</link></item></channel></rss>`;

async function fakeFetch(url:string):Promise<ListingFetchResult>{
  if(url==='https://example.com/nyheter') return {html:listing,finalUrl:url,status:200,contentType:'text/html'};
  if(url==='https://example.com/feed.xml') return {html:feed,finalUrl:url,status:200,contentType:'application/rss+xml'};
  throw new Error('HTTP 404');
}

const recovered=await fetchSourceListingWithRecovery({source:competitor,fetchDocument:fakeFetch,candidateCount:()=>0});
assert.equal(recovered.feedCandidates.length,1,'RSS-kandidaten ska hittas');
assert.equal(recovered.diagnostics.structuredCompetitorCandidatesPromoted,1,'konkurrentkandidaten ska lyftas till listningsdokumentet');
assert.match(recovered.document?.html??'',/Ny vd för svenska verksamheten/,'rubriken ska finnas i syntetisk listning');
assert.match(recovered.document?.html??'',/https:\/\/example\.com\/nyheter\/ny-vd/,'URL ska finnas i syntetisk listning');

const ordinary=await fetchSourceListingWithRecovery({source:media,fetchDocument:fakeFetch,candidateCount:()=>0});
assert.equal(ordinary.diagnostics.structuredCompetitorCandidatesPromoted,0,'vanliga mediekällor ska inte få bypass');
assert.doesNotMatch(ordinary.document?.html??'',/Ny vd för svenska verksamheten/,'vanliga källor ska fortsätta använda ordinarie keyword-filter');

console.log('v3.17 structured competitor intake: PASS');
