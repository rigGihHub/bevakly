import { NextRequest, NextResponse } from 'next/server';
import { getIndustryProfile } from '@/lib/intelligence/industries';
import { extractSourceCandidates } from '@/lib/intelligence/adapters';
import { dedupeCandidates } from '@/lib/intelligence/dedupe';
import { extractArticle, factualSummary } from '@/lib/intelligence/article';
import { classifyFeedItem, ageInDays } from '@/lib/intelligence/news-feed';
import { scoreSignal } from '@/lib/intelligence/score';
import { matchCompetitors, matchGeographies } from '@/lib/intelligence/entities';
import { summarizeSourceNetwork } from '@/lib/intelligence/source-network';
import { assessEvidenceQuality } from '@/lib/intelligence/evidence-quality';
import { discoverSourceSuggestions, type SourceDiscoveryObservation } from '@/lib/intelligence/source-discovery';
import { evaluateSourceValue } from '@/lib/intelligence/source-value';
import { persistIntelligenceHistory } from '@/lib/server/intelligence-history';
import { assessEarlySignal } from '@/lib/intelligence/early-signals';
import { buildAuthorityDiscoveryPlan, summarizeAuthorityDiscoveryPlan } from '@/lib/intelligence/authority-discovery-plan';
import { buildDiscoveryBatch, buildSearchAdapterQueue } from '@/lib/intelligence/discovery-scheduler';
import { canonicalizeDiscoveryUrl } from '@/lib/intelligence/discovery-result-pipeline';
import { configuredDiscoveryProviders } from '@/lib/intelligence/discovery-provider-adapters';
import { runDiscoveryOrchestrator } from '@/lib/intelligence/discovery-orchestrator';
import { providerRuntimeSummary } from '@/lib/intelligence/discovery-provider';
import { allProviderHealth } from '@/lib/intelligence/discovery-provider-health';
import { discoveryProviderConfigStatus } from '@/lib/intelligence/discovery-provider-adapters';

export const dynamic='force-dynamic';
async function fetchText(url:string){const r=await fetch(url,{cache:'no-store',headers:{'user-agent':'Bevakly/1.7 industry-feed (+https://bevakly.se)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text();}
function clampDays(raw:string|null){const n=Number(raw??7);return [1,3,7,30,90].includes(n)?n:7;}

export async function GET(req:NextRequest){
  const q=req.nextUrl.searchParams; const industry=q.get('industry')??'waste'; const custom=q.get('custom')??''; const days=clampDays(q.get('days'));
  const profile=getIndustryProfile(industry,custom); const fetchedAt=new Date().toISOString();
  const authorityDiscoveryPlan=buildAuthorityDiscoveryPlan(profile.sources,profile.id);
  const authorityDiscoveryCoverage=summarizeAuthorityDiscoveryPlan(authorityDiscoveryPlan);
  const authorityDiscoveryBatch=buildDiscoveryBatch(authorityDiscoveryPlan,new Date(fetchedAt),12);
  const authoritySearchQueue=buildSearchAdapterQueue(authorityDiscoveryBatch);
  const providerConfig=discoveryProviderConfigStatus();
  const configuredProviders=configuredDiscoveryProviders();
  const discoveryProvider={...providerRuntimeSummary(),providerConnected:providerConfig.some(x=>x.configured),health:allProviderHealth(),failoverReady:true,providerAdapters:providerConfig};
  const discoveryPipeline={ready:true,canonicalization:'enabled',qualityGate:'enabled',earlySignal:'enabled',entityMatching:'enabled',dedupe:'enabled',evidence:'enabled',providerConnected:discoveryProvider.providerConnected,canonicalUrlExample:canonicalizeDiscoveryUrl('https://example.com/a/?utm_source=test&b=2&a=1')};
  const results=await Promise.all(profile.sources.filter(s=>s.enabled).map(async source=>{try{
    const html=await fetchText(source.listingUrl);
    const items=extractSourceCandidates(html,source,profile.keywords).map(i=>({...i,source:source.name,sourceId:source.id,sourceType:source.type,sourceScope:source.scope,sourceTier:source.tier,trustScore:source.trustScore}));
    return {source,items,error:null as string|null};
  }catch(e){return {source,items:[],error:e instanceof Error?e.message:'Okänt fel'};}}));

  const flattened=results.flatMap(x=>x.items); const clusters=dedupeCandidates(flattened).slice(0,80); let unknownDate=0;
  const discoveryObservations:SourceDiscoveryObservation[]=[];
  const enriched=await Promise.all(clusters.map(async group=>{
    const members=[group,...group.duplicates];
    const originals=members.map(m=>flattened.find(x=>x.url===m.url)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
    const primary=[...originals].sort((a,b)=>a.sourceTier-b.sourceTier||b.trustScore-a.trustScore)[0];
    if(!primary) return null;
    let article={title:'',description:'',publishedAt:null as string|null,textSample:''}; let articleReadOk=true;
    try{const articleHtml=await fetchText(primary.url); article=extractArticle(articleHtml,profile.keywords); discoveryObservations.push({pageUrl:primary.url,pageSource:primary.source,html:articleHtml});}catch{articleReadOk=false;}
    const text=`${article.title||primary.title} ${article.description} ${article.textSample}`; const age=ageInDays(article.publishedAt);
    if(age===null) unknownDate++; if(age===null||age<0||age>days) return null;
    const geographies=matchGeographies(text); const competitors=matchCompetitors(text).map(c=>c.name);
    const scoring=scoreSignal({title:article.title||primary.title,body:text,sourceType:primary.sourceType,trustScore:primary.trustScore,geographyMatches:geographies.length,publishedAt:article.publishedAt});
    const evidenceQuality=assessEvidenceQuality(originals.map(x=>({
      title:x.title,url:x.url,source:x.source,sourceId:x.sourceId,sourceType:x.sourceType,sourceTier:x.sourceTier,trustScore:x.trustScore
    })));
    const independentSourceCount=evidenceQuality.independentOrigins;
    const confirmingSources=[...new Set(originals.map(x=>x.source))];
    return {
      title:article.title||primary.title,url:primary.url,source:primary.source,sourceId:primary.sourceId,contributingSourceIds:[...new Set(originals.map(x=>x.sourceId))],sourceType:primary.sourceType,sourceScope:primary.sourceScope,sourceTier:primary.sourceTier,
      sourceCount:members.length,independentSourceCount,distinctDomainCount:evidenceQuality.distinctDomains,confirmingSources,evidence:evidenceQuality.label,evidenceQuality,publishedAt:article.publishedAt,
      category:classifyFeedItem(text),score:scoring.score,importance:scoring.label,factualSummary:factualSummary(article,primary.title),geographies,competitors,articleReadOk
    };
  }));
  const items=enriched.filter((x):x is NonNullable<typeof x>=>Boolean(x)).sort((a,b)=>new Date(b.publishedAt!).getTime()-new Date(a.publishedAt!).getTime()||b.score-a.score).slice(0,80);
  const activeDiscovery=await runDiscoveryOrchestrator({providers:configuredProviders,queue:authoritySearchQueue,industryKeywords:profile.keywords,knownUrls:items.map(x=>x.url),maxAgeDays:30});
  const sourceSuggestions=discoverSourceSuggestions(discoveryObservations,profile.sources,profile.keywords);
  const discoveryLinks=[...new Map(sourceSuggestions.flatMap(s=>s.sampleLinks.map(link=>[link.url,{...link,domain:s.domain,confidence:s.confidence}] as const))).values()].slice(0,8);
  const knownUrls=new Set(items.map(x=>x.url));
  const discoveryResults=(await Promise.all(discoveryLinks.map(async candidate=>{
    if(knownUrls.has(candidate.url))return null;
    try{
      const html=await fetchText(candidate.url);
      const article=extractArticle(html,profile.keywords);
      const title=article.title||candidate.title; const text=`${title} ${article.description} ${article.textSample}`;
      const age=ageInDays(article.publishedAt);
      if(age===null||age<0||age>30)return null;
      const keywordHits=profile.keywords.filter(k=>k.length>2&&text.toLocaleLowerCase('sv-SE').includes(k.toLocaleLowerCase('sv-SE')));
      if(keywordHits.length===0)return null;
      const geographies=matchGeographies(text); const competitors=matchCompetitors(text).map(c=>c.name);
      const scoring=scoreSignal({title,body:text,sourceType:'media',trustScore:candidate.confidence==='hög'?75:candidate.confidence==='medel'?65:55,geographyMatches:geographies.length,publishedAt:article.publishedAt});
      const earlySignal=assessEarlySignal({title,body:text,url:candidate.url,source:candidate.domain});
      const discoveryScore=Math.min(100,scoring.score+(earlySignal?.scoreBonus??0));
      return {title,url:candidate.url,source:candidate.domain,publishedAt:article.publishedAt,category:classifyFeedItem(text),score:discoveryScore,importance:discoveryScore>=80?'Hög':discoveryScore>=65?'Medel':'Bevaka',factualSummary:factualSummary(article,candidate.title),geographies,competitors,keywordHits:keywordHits.slice(0,6),confidence:candidate.confidence,earlySignal,status:'discovery' as const};
    }catch{return null;}
  }))).filter((x):x is NonNullable<typeof x>=>Boolean(x)).sort((a,b)=>b.score-a.score).slice(0,6);
  const sourceStatus=results.map(r=>{
    const primaryItems=items.filter(item=>item.sourceId===r.source.id).length;
    const confirmationContributions=items.filter(item=>item.independentSourceCount>1&&item.contributingSourceIds.includes(r.source.id)).length;
    return {
      id:r.source.id,name:r.source.name,type:r.source.type,scope:r.source.scope,tier:r.source.tier,description:r.source.description??'',ok:!r.error,hits:r.items.length,error:r.error,
      value:evaluateSourceValue({ok:!r.error,hits:r.items.length,primaryItems,confirmationContributions})
    };
  });
  const persistentIntelligence=await persistIntelligenceHistory(
    fetchedAt,
    sourceStatus.map(s=>({id:s.id,name:s.name,ok:s.ok,hits:s.hits,primaryItems:s.value.primaryItems,confirmationContributions:s.value.confirmationContributions})),
    items.map(item=>({url:item.url,title:item.title,source:item.source,publishedAt:item.publishedAt!,category:item.category,score:item.score,geographies:item.geographies,competitors:item.competitors}))
  );
  return NextResponse.json({
    fetchedAt,industry:{id:profile.id,label:profile.label,description:profile.description},days,totalCandidates:flattened.length,totalInPeriod:items.length,unknownDateExcluded:unknownDate,
    network:summarizeSourceNetwork(profile.sources),authorityDiscoveryCoverage,authorityDiscoveryBatch,authoritySearchQueue,discoveryProvider,discoveryPipeline,activeDiscovery,sourceSuggestions,discoveryResults:[...activeDiscovery.results,...discoveryResults].sort((a,b)=>b.score-a.score).slice(0,12),sourceStatus,persistentIntelligence,
    items,
    note:'Endast händelser med identifierbart publiceringsdatum visas. Myndighets- och kommun-discovery använder en begränsad daglig rotationsbatch; sökjobb som saknar direkt källa exponeras som kö men körs inte utan en riktig sökprovider. Discovery prioriterar nu även tidiga försignaler som samråd, tillstånd, mark/bygglov, kapacitet, rekrytering och myndighetsärenden. Liknande rubriker klustras. Flera domäner räknas inte längre automatiskt som oberoende bekräftelse när publiceringarna sannolikt bygger på samma ursprung. Nya källor visas som discovery-träffar och källförslag men läggs inte automatiskt till i den permanenta bevakningen.'
  });
}
