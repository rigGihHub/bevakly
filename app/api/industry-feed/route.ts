import { NextRequest, NextResponse } from 'next/server';
import { getIndustryProfile } from '@/lib/intelligence/industries';
import { extractSourceCandidates } from '@/lib/intelligence/adapters';
import { dedupeCandidates } from '@/lib/intelligence/dedupe';
import { extractArticle, factualSummary, type ArticleExtraction } from '@/lib/intelligence/article';
import { inferPublishedAtFromUrl } from '@/lib/intelligence/article-recovery';
import { classifyFeedItem, ageInDays } from '@/lib/intelligence/news-feed';
import { scoreSignal } from '@/lib/intelligence/score';
import { matchCompetitors, matchGeographies } from '@/lib/intelligence/entities';
import { summarizeSourceNetwork } from '@/lib/intelligence/source-network';
import { assessEvidenceQuality } from '@/lib/intelligence/evidence-quality';
import { discoverSourceSuggestions, type SourceDiscoveryObservation } from '@/lib/intelligence/source-discovery';
import { evaluateSourceValue } from '@/lib/intelligence/source-value';
import { loadIntelligenceLearningSnapshot, persistIntelligenceHistory } from '@/lib/server/intelligence-history';
import { assessEarlySignal } from '@/lib/intelligence/early-signals';
import { buildAuthorityDiscoveryPlan, summarizeAuthorityDiscoveryPlan } from '@/lib/intelligence/authority-discovery-plan';
import { buildDiscoveryBatch, buildSearchAdapterQueue } from '@/lib/intelligence/discovery-scheduler';
import { canonicalizeDiscoveryUrl } from '@/lib/intelligence/discovery-result-pipeline';
import { configuredDiscoveryProviders } from '@/lib/intelligence/discovery-provider-adapters';
import { runDiscoveryOrchestrator, type DiscoveryOrchestratorRun } from '@/lib/intelligence/discovery-orchestrator';
import { newsIntakeProviderPolicy, providerRuntimeSummary } from '@/lib/intelligence/discovery-provider';
import { buildNewsDiscoveryQueue, summarizeNewsDiscoveryQueue } from '@/lib/intelligence/news-discovery-plan';
import { buildCompetitorNewsQueue, normalizeCompetitorWatchlist, summarizeCompetitorNewsQueue } from '@/lib/intelligence/competitor-news-discovery';
import { buildCompetitorSignalQueue, summarizeCompetitorSignalQueue } from '@/lib/intelligence/competitor-signal-discovery';
import { officialSourceCoverage } from '@/lib/intelligence/competitor-official-sources';
import { buildCompetitorSourceLaneQueue, summarizeCompetitorSourceLanes } from '@/lib/intelligence/competitor-source-lanes';
import { assessNewsCoverage, buildCoverageDrivenNewsQueue } from '@/lib/intelligence/news-coverage';
import { buildSourceExpansionQueue, summarizeSourceExpansionQueue } from '@/lib/intelligence/source-expansion-plan';
import { allProviderHealth } from '@/lib/intelligence/discovery-provider-health';
import { discoveryProviderConfigStatus } from '@/lib/intelligence/discovery-provider-adapters';
import { buildNewsIntakeDiagnostics } from '@/lib/intelligence/news-intake-diagnostics';
import { assessNewsQuality, summarizeNewsQuality, type NewsQualityAssessment } from '@/lib/intelligence/news-quality';
import { assessNewsProvenance, collapseStoryDuplicates } from '@/lib/intelligence/news-provenance';
import { assessFreshEvent, summarizeFreshEvents, type FreshEventAssessment } from '@/lib/intelligence/fresh-event';
import { validateSourceArticle, summarizeArticleValidation, type ArticleValidationAssessment } from '@/lib/intelligence/source-article-validation';
import { assessBidNewsRelevance, summarizeBidNewsRelevance, type BidNewsRelevance } from '@/lib/intelligence/bid-news-relevance';
import { fetchSourceListingWithRecovery, type ListingFetchResult, type SourceRecoveryDiagnostics } from '@/lib/intelligence/source-failure-recovery';
import { prioritizeFreshCandidates, freshnessStateSummary } from '@/lib/intelligence/incremental-crawl';
import { buildAdaptiveSourcePlan, hydrateAdaptiveSourceState, recordAdaptiveSourceOutcomes, adaptiveSourceStateSummary } from '@/lib/intelligence/adaptive-source-crawl';
import { assessSourceDiversity } from '@/lib/intelligence/source-diversity';
import { buildMunicipalProtocolQueue, summarizeMunicipalProtocolDiscovery } from '@/lib/intelligence/municipal-protocol-discovery';
import { buildCompetitorJobQueue, summarizeCompetitorJobDiscovery, classifyJobSignal } from '@/lib/intelligence/competitor-job-discovery';
import { buildPublicRecordsQueue, summarizePublicRecordsDiscovery } from '@/lib/intelligence/public-records-discovery';
import { fuseSignals, sourceClassFromTarget } from '@/lib/intelligence/signal-fusion';
import { buildAmbiguousCaseHoldingArea } from '@/lib/intelligence/ambiguous-case-holding';
import { loadAmbiguousCandidates, persistAmbiguousCandidates, applyAmbiguousCandidateResolutions } from '@/lib/server/ambiguous-case-holding';
import { reevaluatePersistentCandidates } from '@/lib/intelligence/ambiguous-case-reevaluation';
import { buildSignalTimelines, summarizeSignalTimelines } from '@/lib/intelligence/signal-timeline';
import { buildEntityGraph, organizationGraphView, organizationAliasSummary } from '@/lib/intelligence/entity-graph';
import { buildLeadTimeSummary } from '@/lib/intelligence/lead-time';
import { buildCaseSnapshots } from '@/lib/intelligence/case-history';
import { buildStrategicDeltas, summarizeStrategicDeltas } from '@/lib/intelligence/strategic-delta';
import { buildEvidenceDrilldowns } from '@/lib/intelligence/evidence-drilldown';
import { buildCaseEvolutions, summarizeCaseEvolutions } from '@/lib/intelligence/case-evolution';
import { buildWhyItMatters, whyItMattersSummary } from '@/lib/intelligence/why-it-matters';
import { buildSourceGapResults, summarizeSourceGaps } from '@/lib/intelligence/source-gap';
import { buildGapDrivenDiscoveryQueue } from '@/lib/intelligence/gap-driven-discovery';
import { gapDiscoveryFeedbackSummary, hydrateGapDiscoveryFeedback, rankGapDiscoveryQueue, recordGapDiscoveryFeedback } from '@/lib/intelligence/discovery-feedback-loop';
import { loadPersistentDiscoveryLearning, persistDiscoveryLearningObservations } from '@/lib/server/discovery-learning';
import { buildEvidencePromotionBatch } from '@/lib/intelligence/evidence-promotion';
import { loadPendingEvidenceBefore, markEvidencePromotionDecisions, savePendingGapEvidence } from '@/lib/server/evidence-promotion';
import { persistCaseSnapshots, loadCaseSnapshots } from '@/lib/server/case-history';
import { monitorCompetitorWebsites } from '@/lib/intelligence/competitor-website-monitor';
import { buildCoolingAssessments, summarizeCooling } from '@/lib/intelligence/negative-evidence-cooling';
import { buildIntelligencePriorities, summarizeIntelligencePriorities } from '@/lib/intelligence/intelligence-priority';
import { buildAnalystActionQueue, summarizeAnalystActionQueue } from '@/lib/intelligence/analyst-action-queue';
import { buildSwedishCoverageGapMatrix, summarizeSwedishCoverageGapMatrix } from '@/lib/intelligence/swedish-coverage-gap';
import { buildCoverageGapDiscoveryQueue } from '@/lib/intelligence/coverage-gap-discovery';
import { buildCoverageSourceRecommendations } from '@/lib/intelligence/coverage-source-advisor';
import { buildCoverageCrawlHints } from '@/lib/intelligence/coverage-crawl-budget';
import { loadPersistentSourceHealth, persistSourceHealthOutcomes } from '@/lib/server/source-health-learning';
import { loadCoverageBudgetHistory, persistCoverageBudgetAudit } from '@/lib/server/coverage-budget-audit-history';
import { buildEvidenceWeightedNewsFeed, type EvidenceWeightedNewsInput } from '@/lib/intelligence/independent-evidence-weighting';
import { buildRefreshDeadlines, buildRefreshSourceBudget } from '@/lib/intelligence/refresh-runtime-budget';
import { buildSpecialWatchDiscoveryQueue } from '@/lib/intelligence/special-watch-discovery';

export const dynamic='force-dynamic';
async function fetchDocument(url:string,timeoutMs=9000):Promise<ListingFetchResult>{const r=await fetch(url,{cache:'no-store',redirect:'follow',headers:{'user-agent':'Bevakly/2.78 industry-feed (+https://bevakly.se)','accept':'text/html,application/xhtml+xml,application/rss+xml,application/atom+xml,application/xml;q=0.9,*/*;q=0.7'},signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return {html:await r.text(),finalUrl:r.url||url,status:r.status,contentType:r.headers.get('content-type')??''};}
async function fetchText(url:string){return (await fetchDocument(url,9000)).html;}
async function mapWithConcurrency<T,R>(items:T[],limit:number,worker:(item:T)=>Promise<R>):Promise<R[]>{
  const out=new Array<R>(items.length); let cursor=0;
  async function run(){while(true){const index=cursor++; if(index>=items.length)return; out[index]=await worker(items[index]);}}
  await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},run));
  return out;
}
function clampDays(raw:string|null){const n=Number(raw??7);return [1,3,7,30,90].includes(n)?n:7;}
async function settleBefore<T>(deadline:number,task:()=>Promise<T>):Promise<T|null>{
  const remaining=deadline-Date.now();if(remaining<=0)return null;
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{return await Promise.race([task(),new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),remaining)})]);}
  finally{if(timer)clearTimeout(timer);}
}
function timedOutRecovery():SourceRecoveryDiagnostics{return {primaryAttempted:true,primaryOk:false,retryAttempted:false,retryOk:false,baseFallbackAttempted:false,baseFallbackOk:false,feedDiscoveryAttempted:false,feedDiscovered:false,feedFetchOk:false,feedCandidates:0,sitemapDiscoveryAttempted:false,sitemapDiscovered:false,sitemapFetchOk:false,sitemapCandidates:0,robotsChecked:false,sitemapIndexFollowed:0,structuredRequests:0,structuredCompetitorCandidatesPromoted:0,recoveryMode:'none',recovered:false,error:'Avbruten av uppdateringens tidsbudget'};}
function emptyDiscovery(queueLength:number,providers:string[],reason:string):DiscoveryOrchestratorRun{return {status:'budget-stopped',configuredProviders:providers,queuedJobs:queueLength,executedQueries:0,providerRequests:0,cacheHits:0,estimatedCost:0,providerHits:0,processedResults:0,acceptedBeforeDedupe:0,accepted:0,rejected:0,hostRejected:0,dedupeDropped:0,recoveryAttempted:0,recoverySucceeded:0,recoveredAccepted:0,rejectionReasons:{},stoppedReason:reason,attempts:[],results:[]};}
function discoveryNewsSourceType(targetId:string){
  const sourceClass=sourceClassFromTarget(targetId);
  return ['municipal','environmental','competition','planning','legal','authority'].includes(sourceClass)?'authority':'media';
}

export async function GET(req:NextRequest){
  const refreshStartedAt=Date.now();const refreshDeadlines=buildRefreshDeadlines(refreshStartedAt,45_000);
  const q=req.nextUrl.searchParams; const industry=q.get('industry')??'waste'; const custom=q.get('custom')??''; const days=clampDays(q.get('days'));
  const requestedActors=normalizeCompetitorWatchlist((q.get('actors')??'').split('|').map((x:string)=>x.trim()).filter(Boolean));
  const profile=getIndustryProfile(industry,custom); const fetchedAt=new Date().toISOString();
  const authorityDiscoveryPlan=buildAuthorityDiscoveryPlan(profile.sources,profile.id);
  const authorityDiscoveryCoverage=summarizeAuthorityDiscoveryPlan(authorityDiscoveryPlan);
  const authorityDiscoveryBatch=buildDiscoveryBatch(authorityDiscoveryPlan,new Date(fetchedAt),12);
  const authoritySearchQueue=buildSearchAdapterQueue(authorityDiscoveryBatch);
  const providerConfig=discoveryProviderConfigStatus();
  const configuredProviders=configuredDiscoveryProviders();
  const discoveryProvider={...providerRuntimeSummary(newsIntakeProviderPolicy),providerConnected:providerConfig.some(x=>x.configured),health:allProviderHealth(),failoverReady:true,providerAdapters:providerConfig};
  const discoveryPipeline={ready:true,canonicalization:'enabled',qualityGate:'enabled',earlySignal:'enabled',entityMatching:'enabled',dedupe:'enabled',evidence:'enabled',providerConnected:discoveryProvider.providerConnected,canonicalUrlExample:canonicalizeDiscoveryUrl('https://example.com/a/?utm_source=test&b=2&a=1')};
  const enabledSources=profile.sources.filter(s=>s.enabled);
  const sourceDiversity=assessSourceDiversity(enabledSources);
  const persistentSourceHealthLoad=await loadPersistentSourceHealth();
  const hydratedSourceHealth=hydrateAdaptiveSourceState(persistentSourceHealthLoad.rows);
  const preCrawlLearning=profile.id==='waste'?await loadIntelligenceLearningSnapshot():{enabled:false as const,sourceLearning:[],coverageSourceLearning:[],reason:'Coverage crawl budgeting används bara för avfallsprofilen.'};
  const coverageCrawlHints=profile.id==='waste'?buildCoverageCrawlHints({sources:enabledSources,coverageHistory:preCrawlLearning.coverageSourceLearning,sourceLearning:preCrawlLearning.sourceLearning}):[];
  const adaptiveSourcePlan=buildAdaptiveSourcePlan(enabledSources,new Date(fetchedAt),coverageCrawlHints);
  const planBySource=new Map(adaptiveSourcePlan.map(x=>[x.source.id,x] as const));
  const refreshSourceBudget=buildRefreshSourceBudget(adaptiveSourcePlan,new Date(fetchedAt),24);
  const orderedSources=refreshSourceBudget.selected.map(x=>x.source);
  const results=await mapWithConcurrency(orderedSources,8,async source=>{
    const recovered=await settleBefore(refreshDeadlines.sources,()=>fetchSourceListingWithRecovery({
      source,fetchDocument,
      candidateCount:(html)=>extractSourceCandidates(html,source,profile.keywords).length,
    }));
    if(!recovered)return {source,items:[],error:'Avbruten av uppdateringens tidsbudget',recovery:timedOutRecovery(),freshness:{considered:0,unseen:0,seenRecently:0,prioritizedUnseen:0,retainedSeenForCoverage:0,stateEntries:freshnessStateSummary().entries,stateMode:'memory' as const,retentionDays:45},extraBudgetCandidateUrls:[] as string[]};
    if(!recovered.document) return {source,items:[],error:recovered.diagnostics.error??'Kunde inte hämta källa',recovery:recovered.diagnostics,freshness:{considered:0,unseen:0,seenRecently:0,prioritizedUnseen:0,retainedSeenForCoverage:0,stateEntries:freshnessStateSummary().entries,stateMode:'memory' as const,retentionDays:45},extraBudgetCandidateUrls:[] as string[]};
    const htmlItems=extractSourceCandidates(recovered.document.html,source,profile.keywords);
    const feedItems=recovered.feedCandidates.filter(i=>{
      const hay=i.title.toLocaleLowerCase('sv-SE');
      return profile.keywords.some(k=>hay.includes(k.toLocaleLowerCase('sv-SE')));
    });
    const sitemapItems=recovered.sitemapCandidates.filter(i=>{
      const hay=i.title.toLocaleLowerCase('sv-SE');
      return profile.keywords.some(k=>hay.includes(k.toLocaleLowerCase('sv-SE')));
    });
    const combined=[...htmlItems,...feedItems,...sitemapItems];
    const unique=new Map<string,(typeof combined)[number]>();
    for(const item of combined){const key=item.url.replace(/\/$/,''); if(!unique.has(key))unique.set(key,item);}
    const plan=planBySource.get(source.id);
    const fresh=prioritizeFreshCandidates({sourceId:source.id,items:[...unique.values()],limit:plan?.candidateLimit??30,now:new Date(fetchedAt)});
    const items=fresh.items.map(i=>({...i,source:source.name,sourceId:source.id,sourceType:source.type,sourceScope:source.scope,sourceTier:source.tier,trustScore:source.trustScore}));
    const baselineLimit=plan?.baseCandidateLimit??plan?.candidateLimit??30;
    const extraBudgetCandidateUrls=fresh.items.slice(baselineLimit).map(i=>i.url);
    return {source,items,error:null as string|null,recovery:recovered.diagnostics,freshness:fresh.diagnostics,extraBudgetCandidateUrls};
  });

  const flattened=results.flatMap(x=>x.items); const clusters=dedupeCandidates(flattened).slice(0,72); let unknownDate=0;
  let missingPrimary=0,articleReadAttempted=0,articleReadOkCount=0,articleReadFailed=0,outsideSelectedPeriod=0,dateRecoveredFromArticle=0,dateRecoveredFromUrl=0,articleExtractionRecovered=0,articleExtractionThin=0; const newsQualityAssessments:NewsQualityAssessment[]=[]; let newsQualityRejected=0,newsQualityThin=0; const freshEventAssessments:FreshEventAssessment[]=[]; const articleValidationAssessments:ArticleValidationAssessment[]=[]; let articleValidationRejected=0,articleValidationThin=0; const bidNewsRelevanceAssessments:BidNewsRelevance[]=[];
  const articleExtractionMethods:Record<string,number>={};
  const discoveryObservations:SourceDiscoveryObservation[]=[];
  const enriched=await mapWithConcurrency(clusters,10,async group=>{
    if(Date.now()>=refreshDeadlines.articles)return null;
    const members=[group,...group.duplicates];
    const originals=members.map(m=>flattened.find(x=>x.url===m.url)).filter((x):x is NonNullable<typeof x>=>Boolean(x));
    const primary=[...originals].sort((a,b)=>a.sourceTier-b.sourceTier||b.trustScore-a.trustScore)[0];
    if(!primary){missingPrimary++; return null;}
    let article:ArticleExtraction={title:'',description:'',publishedAt:null,textSample:'',extractionMethod:'none',extractedChars:0}; let articleReadOk=true; articleReadAttempted++;
    try{const articleHtml=await settleBefore(refreshDeadlines.articles,()=>fetchText(primary.url));if(!articleHtml)throw new Error('article time budget'); article=extractArticle(articleHtml,profile.keywords); discoveryObservations.push({pageUrl:primary.url,pageSource:primary.source,html:articleHtml}); articleReadOkCount++; articleExtractionMethods[article.extractionMethod]=(articleExtractionMethods[article.extractionMethod]??0)+1; if(article.extractionMethod!=='none'&&article.extractionMethod!=='metadata')articleExtractionRecovered++; if(article.extractedChars<120)articleExtractionThin++; if(article.publishedAt)dateRecoveredFromArticle++;}catch{articleReadOk=false; articleReadFailed++;}
    if(!article.publishedAt){const urlDate=inferPublishedAtFromUrl(primary.url); if(urlDate){article={...article,publishedAt:urlDate};dateRecoveredFromUrl++;}}
    const text=`${article.title||primary.title} ${article.description} ${article.textSample}`; const age=ageInDays(article.publishedAt);
    if(age===null){unknownDate++; return null;}
    if(age<0||age>days){outsideSelectedPeriod++; return null;}
    const articleValidation=validateSourceArticle({requestedTitle:primary.title,url:primary.url,article});
    articleValidationAssessments.push(articleValidation);
    if(articleValidation.decision==='reject'){articleValidationRejected++;return null;}
    if(articleValidation.decision==='thin')articleValidationThin++;
    const geographies=matchGeographies(text); const competitors=matchCompetitors(text).map(c=>c.name);
    const newsQuality=assessNewsQuality({title:primary.title,article,sourceType:primary.sourceType,geographies,competitors,topicTerms:profile.id==='waste'?undefined:profile.keywords});
    newsQualityAssessments.push(newsQuality);
    if(newsQuality.decision==='reject'){newsQualityRejected++;return null;}
    if(newsQuality.decision==='accept-thin')newsQualityThin++;
    const bidNewsRelevance=profile.id==='waste'?assessBidNewsRelevance({title:article.title||primary.title,text,competitors,geographies,sourceType:primary.sourceType}):null;
    if(bidNewsRelevance)bidNewsRelevanceAssessments.push(bidNewsRelevance);
    const scoring=scoreSignal({title:article.title||primary.title,body:text,sourceType:primary.sourceType,trustScore:primary.trustScore,geographyMatches:geographies.length,publishedAt:article.publishedAt});
    const newsProvenance=assessNewsProvenance({title:article.title||primary.title,url:primary.url,source:primary.source,sourceType:primary.sourceType,sourceTier:primary.sourceTier,trustScore:primary.trustScore,publishedAt:article.publishedAt});
    const freshEvent=assessFreshEvent({title:article.title||primary.title,article,publishedAt:article.publishedAt,provenance:newsProvenance,now:new Date(fetchedAt)});
    freshEventAssessments.push(freshEvent);
    const rawQualityAdjustedScore=newsQuality.decision==='accept-thin'?Math.min(scoring.score,54):scoring.score;
    const articleValidationAdjustment=articleValidation.decision==='thin'?-8:0;
    const qualityAdjustedScore=Math.max(0,Math.min(100,rawQualityAdjustedScore+newsProvenance.qualityAdjustment+freshEvent.freshnessAdjustment+articleValidationAdjustment+(bidNewsRelevance?.adjustment??0)));
    const evidenceQuality=assessEvidenceQuality(originals.map(x=>({
      title:x.title,url:x.url,source:x.source,sourceId:x.sourceId,sourceType:x.sourceType,sourceTier:x.sourceTier,trustScore:x.trustScore
    })));
    const independentSourceCount=evidenceQuality.independentOrigins;
    const confirmingSources=[...new Set(originals.map(x=>x.source))];
    return {
      title:article.title||primary.title,url:primary.url,source:primary.source,sourceId:primary.sourceId,contributingSourceIds:[...new Set(originals.map(x=>x.sourceId))],sourceType:primary.sourceType,sourceScope:primary.sourceScope,sourceTier:primary.sourceTier,
      trustScore:primary.trustScore,
      sourceCount:members.length,independentSourceCount,distinctDomainCount:evidenceQuality.distinctDomains,confirmingSources,evidence:evidenceQuality.label,evidenceQuality,publishedAt:article.publishedAt,
      supportingSources:originals.map(x=>({title:x.title,url:x.url,source:x.source,sourceId:x.sourceId,sourceType:x.sourceType,sourceTier:x.sourceTier,trustScore:x.trustScore})),
      category:classifyFeedItem(text),score:qualityAdjustedScore,importance:newsQuality.decision==='accept-thin'?'Bevaka':scoring.label,factualSummary:factualSummary(article,primary.title),geographies,competitors,articleReadOk,articleValidation,newsQuality,newsProvenance,freshEvent,bidNewsRelevance
    };
  });
  const qualityPassed=enriched.filter((x):x is NonNullable<typeof x>=>Boolean(x));
  const storyDeduplication=collapseStoryDuplicates(qualityPassed);
  const items=storyDeduplication.items.sort((a,b)=>new Date(b.publishedAt!).getTime()-new Date(a.publishedAt!).getTime()||b.score-a.score).slice(0,120);
  const newsQualitySummary={...summarizeNewsQuality(newsQualityAssessments),rejectedBeforeFeed:newsQualityRejected,thinRetained:newsQualityThin,storyDeduplication:storyDeduplication.diagnostics};
  const freshEventSummary=summarizeFreshEvents(freshEventAssessments);
  const articleValidationSummary={...summarizeArticleValidation(articleValidationAssessments),rejectedBeforeFeed:articleValidationRejected,thinRetained:articleValidationThin};
  const bidNewsRelevanceSummary=summarizeBidNewsRelevance(bidNewsRelevanceAssessments);
  const newsCoverage=profile.id==='waste'?assessNewsCoverage(items):null;
  // v2.40: preserve broad thematic discovery, but reserve dedicated lanes for local media, competitor-owned sources,
  // Swedish industry media and international reporting with Swedish relevance. Coverage gaps still steer part of the budget.
  const competitorNewsQueue=profile.id==='waste'?buildCompetitorNewsQueue(requestedActors,new Date(fetchedAt),6):[];
  const competitorSignalQueue=profile.id==='waste'?buildCompetitorSignalQueue(requestedActors,new Date(fetchedAt),4):[];
  const competitorOfficialSources=profile.id==='waste'?officialSourceCoverage(normalizeCompetitorWatchlist(requestedActors,6)):null;
  const competitorSourceLaneQueue=profile.id==='waste'?buildCompetitorSourceLaneQueue(requestedActors,new Date(fetchedAt),4):[];
  const rotatingNewsCandidates=profile.id==='waste'?buildNewsDiscoveryQueue(new Date(fetchedAt),12):[];
  const rotatingNewsQueue=rotatingNewsCandidates.slice(0,2);
  const coverageNewsQueue=profile.id==='waste'?buildCoverageDrivenNewsQueue({items,now:new Date(fetchedAt),maxQueries:2}):[];
  const sourceExpansionQueue=profile.id==='waste'?buildSourceExpansionQueue(new Date(fetchedAt),2):[];
  const targetNewsSlots=Math.min(14,newsIntakeProviderPolicy.maxQueriesPerRun);
  const usedNewsSlots=competitorNewsQueue.length+competitorSignalQueue.length+competitorSourceLaneQueue.filter(x=>x.sourceClass==='news').length+rotatingNewsQueue.length+coverageNewsQueue.length+sourceExpansionQueue.length;
  const newsBackfill=rotatingNewsCandidates.slice(4,4+Math.max(0,targetNewsSlots-usedNewsSlots));
  const officialNewsLane=competitorSourceLaneQueue;
  const specialWatchQueue=buildSpecialWatchDiscoveryQueue(profile.id,new Date(fetchedAt),8);
  const newsDiscoveryQueue=specialWatchQueue.length?specialWatchQueue:[...competitorNewsQueue,...competitorSignalQueue,...officialNewsLane,...rotatingNewsQueue,...coverageNewsQueue,...sourceExpansionQueue,...newsBackfill];
  const municipalProtocolQueue=profile.id==='waste'?buildMunicipalProtocolQueue(new Date(fetchedAt),3):[];
  const competitorJobQueue=profile.id==='waste'?buildCompetitorJobQueue(requestedActors,new Date(fetchedAt),3):[];
  const publicRecordsQueue=profile.id==='waste'?buildPublicRecordsQueue(new Date(fetchedAt),2):[];
  const authoritySlots=Math.max(0,newsIntakeProviderPolicy.maxQueriesPerRun-newsDiscoveryQueue.length-municipalProtocolQueue.length-competitorJobQueue.length-publicRecordsQueue.length);
  const combinedDiscoveryQueue=[...newsDiscoveryQueue,...municipalProtocolQueue,...competitorJobQueue,...publicRecordsQueue,...authoritySearchQueue.slice(0,authoritySlots)];
  const boundedDiscoveryPolicy={...newsIntakeProviderPolicy,maxQueriesPerRun:8,maxResultsPerQuery:10};
  const activeDiscovery=await settleBefore(refreshDeadlines.discovery,()=>runDiscoveryOrchestrator({providers:configuredProviders,queue:combinedDiscoveryQueue,industryKeywords:profile.keywords,knownUrls:items.map(x=>x.url),maxAgeDays:30,policy:boundedDiscoveryPolicy}))
    ??emptyDiscovery(combinedDiscoveryQueue.length,configuredProviders.map(x=>x.id),'refresh-time-budget');

  const competitorJobSignals=activeDiscovery.results.filter(x=>x.targetId.startsWith('competitor-jobs:')).map(x=>({id:x.id,competitor:x.targetName.replace(/ – jobbannonser$/,''),title:x.title,url:x.url,publishedAt:x.publishedAt,geographies:x.geographies,classification:classifyJobSignal(`${x.title} ${x.snippet}`),factConfidence:x.factConfidence,interpretationConfidence:x.interpretationConfidence}));

  // v2.68: only evidence saved by a PREVIOUS request may enter this run's fusion.
  // Current gap-discovery hits are saved later in the request and can therefore never
  // self-reinforce the hypothesis that generated them in the same analysis cycle.
  const pendingEvidenceLoad=await loadPendingEvidenceBefore(fetchedAt,100);
  const evidencePromotionBatch=buildEvidencePromotionBatch(pendingEvidenceLoad.items,new Date(fetchedAt));
  const activeCanonicalUrls=new Set(activeDiscovery.results.map(x=>canonicalizeDiscoveryUrl(x.url)).filter(Boolean));
  const promotedFusionInputs=evidencePromotionBatch.promoted.filter(x=>!activeCanonicalUrls.has(canonicalizeDiscoveryUrl(x.url)));

  const fusionInputs=[
    ...activeDiscovery.results.map(x=>({id:x.id,title:x.title,url:x.url,publishedAt:x.publishedAt,sourceClass:sourceClassFromTarget(x.targetId),source:x.source,competitors:x.competitors,geographies:x.geographies,text:`${x.title} ${x.snippet} ${x.keywordHits.join(' ')}`,factConfidence:x.factConfidence})),
    ...promotedFusionInputs,
  ];
  const entityGraph=buildEntityGraph(fusionInputs);
  const competitorEntityViews=organizationAliasSummary().map(x=>organizationGraphView(entityGraph,x.organization)).filter(x=>x.geographies.length||x.signalClasses.length||x.sources.length);
  const ambiguousCaseHoldingArea=buildAmbiguousCaseHoldingArea(fusionInputs);
  const persistentAmbiguousCandidateLoad=await loadAmbiguousCandidates(90,200);
  const persistentCandidateReevaluation=reevaluatePersistentCandidates(persistentAmbiguousCandidateLoad.candidates,fusionInputs,fetchedAt);
  const persistentCandidateResolution=await applyAmbiguousCandidateResolutions(persistentCandidateReevaluation.decisions.map(x=>({candidateKey:x.candidateKey,decision:x.decision,reason:x.reasons.join(' ')})));
  const persistentAmbiguousCandidateSave=await persistAmbiguousCandidates(ambiguousCaseHoldingArea.candidates,fetchedAt);
  const persistentAmbiguousCandidates={load:persistentAmbiguousCandidateLoad.status,save:persistentAmbiguousCandidateSave,reevaluation:persistentCandidateReevaluation,resolution:persistentCandidateResolution,candidates:persistentAmbiguousCandidateLoad.candidates,guardrail:'v2.89 omprövar sparade kandidater mot ny evidens. Persistens i sig ger 0 confidence. Promotion kräver ny identitetsstärkande evidens och går fortfarande genom vanliga fusion-/evidensregler.'};
  const fusedSignals=fuseSignals(fusionInputs,12);
  const evidencePromotionMark=await markEvidencePromotionDecisions(evidencePromotionBatch.decisions);
  const signalTimelines=buildSignalTimelines(fusedSignals,new Date(fetchedAt),12);
  const signalTimelineSummary=summarizeSignalTimelines(signalTimelines);
  const whyItMatters=buildWhyItMatters(signalTimelines,fusedSignals);
  const whyItMattersSummaryPayload=whyItMattersSummary(whyItMatters);
  const fusionByTimelineId=new Map(fusedSignals.map(f=>[`timeline-${f.id}`,f] as const));
  const sourceGaps=buildSourceGapResults(signalTimelines.map(t=>{
    const fusion=fusionByTimelineId.get(t.id);
    return {
      timelineId:t.id,
      headline:t.headline,
      hypothesis:fusion?.hypothesis??'multi-source-change',
      sourceClasses:t.sourceClasses,
      stage:t.stage,
      interpretationConfidence:t.interpretationConfidence,
      escalationScore:t.escalationScore,
      competitors:t.competitors,
      geographies:t.geographies,
    };
  }));
  const sourceGapSummary=summarizeSourceGaps(sourceGaps);
  const gapContext=new Map(signalTimelines.map(t=>[t.id,{competitors:t.competitors,geographies:t.geographies}] as const));
  const gapDrivenDiscoveryPlan=buildGapDrivenDiscoveryQueue(sourceGaps,gapContext,new Date(fetchedAt),4);
  const persistentDiscoveryLearningLoad=await loadPersistentDiscoveryLearning(200);
  const hydratedDiscoveryPatterns=hydrateGapDiscoveryFeedback(persistentDiscoveryLearningLoad.rows);
  const rankedGapDrivenQueue=rankGapDiscoveryQueue(gapDrivenDiscoveryPlan.queue);
  const gapDrivenPolicy={...newsIntakeProviderPolicy,maxQueriesPerRun:2,maxResultsPerQuery:8,maxEstimatedCostPerRun:0.02};
  const gapDrivenDiscovery=await settleBefore(refreshDeadlines.total,()=>runDiscoveryOrchestrator({
    providers:configuredProviders,
    queue:rankedGapDrivenQueue.slice(0,2),
    industryKeywords:profile.keywords,
    knownUrls:[...items.map(x=>x.url),...activeDiscovery.results.map(x=>x.url)],
    maxAgeDays:90,
    policy:gapDrivenPolicy,
    estimatedCostPerProviderRequest:0.01,
  }))??emptyDiscovery(Math.min(2,rankedGapDrivenQueue.length),configuredProviders.map(x=>x.id),'refresh-time-budget');
  const gapDiscoveryFeedbackObserved=recordGapDiscoveryFeedback(rankedGapDrivenQueue,gapDrivenDiscovery,new Date(fetchedAt));
  const persistentDiscoveryLearningSave=await persistDiscoveryLearningObservations(gapDiscoveryFeedbackObserved);
  const pendingEvidenceSave=await savePendingGapEvidence(gapDrivenDiscovery.results,rankedGapDrivenQueue,fetchedAt);
  const gapDiscoveryFeedback={
    ...gapDiscoveryFeedbackSummary(),
    persistentLearning:{
      configured:persistentDiscoveryLearningLoad.status.configured||persistentDiscoveryLearningSave.configured,
      enabled:persistentDiscoveryLearningLoad.status.enabled&&persistentDiscoveryLearningSave.enabled,
      schemaReady:persistentDiscoveryLearningLoad.status.schemaReady&&persistentDiscoveryLearningSave.schemaReady,
      loadedPatterns:persistentDiscoveryLearningLoad.status.loadedPatterns,
      hydratedPatterns:hydratedDiscoveryPatterns,
      savedObservations:persistentDiscoveryLearningSave.savedObservations,
      mode:(persistentDiscoveryLearningLoad.status.enabled&&persistentDiscoveryLearningSave.enabled?'database':'memory') as 'database'|'memory',
      reason:persistentDiscoveryLearningLoad.status.reason??persistentDiscoveryLearningSave.reason,
    },
  };
  const leadTimeSummary=buildLeadTimeSummary(signalTimelines);
  const caseSnapshots=buildCaseSnapshots(signalTimelines,fetchedAt);
  const caseHistoryPersistence=await persistCaseSnapshots(caseSnapshots);
  const loadedCaseHistory=caseHistoryPersistence.enabled
    ?await loadCaseSnapshots(caseSnapshots.map(x=>x.caseKey),180)
    :{enabled:false,snapshots:[],reason:caseHistoryPersistence.reason};
  const caseEvolutionSnapshots=loadedCaseHistory.enabled&&loadedCaseHistory.snapshots.length
    ?loadedCaseHistory.snapshots
    :caseSnapshots;
  const caseEvolutions=buildCaseEvolutions(caseEvolutionSnapshots,8);
  const caseEvolutionSummary={...summarizeCaseEvolutions(caseEvolutions),historySource:loadedCaseHistory.enabled?'database':'current-run',reason:loadedCaseHistory.reason};
  const strategicDeltas=buildStrategicDeltas(caseEvolutionSnapshots,new Date(fetchedAt),30,90);
  const strategicDeltaSummary={...summarizeStrategicDeltas(strategicDeltas),historySource:loadedCaseHistory.enabled?'database':'current-run',historyVerified:loadedCaseHistory.enabled};
  const evidenceDrilldowns=buildEvidenceDrilldowns({deltas:strategicDeltas,snapshots:caseEvolutionSnapshots,timelines:signalTimelines,why:whyItMatters});
  const caseKeyByTimeline=new Map(caseSnapshots.map(s=>[s.timelineId,s.caseKey] as const));
  const coolingAssessments=buildCoolingAssessments({
    timelines:signalTimelines,
    gaps:sourceGaps,
    snapshots:loadedCaseHistory.enabled?loadedCaseHistory.snapshots:[],
    caseKeyByTimeline,
    now:new Date(fetchedAt),
  });
  const coolingSummary=summarizeCooling(coolingAssessments);
  const intelligencePriorities=buildIntelligencePriorities({
    timelines:signalTimelines,
    why:whyItMatters,
    gaps:sourceGaps,
    cooling:coolingAssessments,
    evolutions:caseEvolutions,
    caseKeyByTimeline,
  });
  const intelligencePrioritySummary=summarizeIntelligencePriorities(intelligencePriorities);
  const analystActionQueue=buildAnalystActionQueue({
    priorities:intelligencePriorities,
    timelines:signalTimelines,
    gaps:sourceGaps,
    why:whyItMatters,
    cooling:coolingAssessments,
  });
  const analystActionSummary=summarizeAnalystActionQueue(analystActionQueue);
  const competitorWebsiteMonitor=profile.id==='waste'&&Date.now()<refreshDeadlines.total-5_000?await monitorCompetitorWebsites(new Date(fetchedAt),3):{changes:[],diagnostics:{checked:0,failed:0,baselinesCreated:0,changesDetected:0,persistence:'process-local' as const,verifiedPages:0}};

  const newsIntakeDiagnostics=buildNewsIntakeDiagnostics({
    fixed:{
      configuredSources:enabledSources.length,
      sourceFetchOk:results.filter(x=>!x.error).length,
      sourceFetchFailed:results.filter(x=>Boolean(x.error)).length,
      sourceRecoveryAttempted:results.filter(x=>x.recovery.retryAttempted||x.recovery.baseFallbackAttempted||x.recovery.feedDiscoveryAttempted||x.recovery.sitemapDiscoveryAttempted).length,
      sourceRecovered:results.filter(x=>x.recovery.recovered).length,
      sourceRecoveredByRetry:results.filter(x=>x.recovery.recoveryMode==='retry').length,
      sourceRecoveredByBase:results.filter(x=>x.recovery.recoveryMode==='base').length,
      sourceRecoveredByFeed:results.filter(x=>x.recovery.recoveryMode==='feed'||x.recovery.recoveryMode==='structured').length,
      sourceRecoveredBySitemap:results.filter(x=>x.recovery.recoveryMode==='sitemap'||x.recovery.recoveryMode==='structured').length,
      structuredDiscoveryRequests:results.reduce((n,x)=>n+x.recovery.structuredRequests,0),
      feedCandidatesRecovered:results.reduce((n,x)=>n+x.recovery.feedCandidates,0),
      sitemapCandidatesRecovered:results.reduce((n,x)=>n+x.recovery.sitemapCandidates,0),
      rawCandidates:flattened.length,
      clustersConsidered:clusters.length,
      missingPrimary,
      articleReadAttempted,
      articleReadOk:articleReadOkCount,
      articleReadFailed,
      dateRecoveredFromArticle,
      dateRecoveredFromUrl,
      missingOrInvalidDate:unknownDate,
      outsideSelectedPeriod,
      acceptedInPeriod:items.length,
      articleExtractionRecovered,
      articleExtractionThin,
      articleExtractionMethods,
    },
    discovery:{
      queuedJobs:activeDiscovery.queuedJobs,
      executedQueries:activeDiscovery.executedQueries,
      providerRequests:activeDiscovery.providerRequests,
      cacheHits:activeDiscovery.cacheHits,
      providerHits:activeDiscovery.providerHits,
      processedResults:activeDiscovery.processedResults,
      acceptedBeforeDedupe:activeDiscovery.acceptedBeforeDedupe,
      rejected:activeDiscovery.rejected,
      hostRejected:activeDiscovery.hostRejected,
      dedupeDropped:activeDiscovery.dedupeDropped,
      recoveryAttempted:activeDiscovery.recoveryAttempted,
      recoverySucceeded:activeDiscovery.recoverySucceeded,
      recoveredAccepted:activeDiscovery.recoveredAccepted,
      accepted:activeDiscovery.accepted,
      rejectionReasons:activeDiscovery.rejectionReasons,
    }
  });

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
  }))).filter((x):x is NonNullable<typeof x>=>Boolean(x)).sort((a,b)=>b.score-a.score).slice(0,12);
  const sourceStatus=results.map(r=>{
    const primaryItems=items.filter(item=>item.sourceId===r.source.id).length;
    const confirmationContributions=items.filter(item=>item.independentSourceCount>1&&item.contributingSourceIds.includes(r.source.id)).length;
    return {
      id:r.source.id,name:r.source.name,type:r.source.type,scope:r.source.scope,tier:r.source.tier,description:r.source.description??'',ok:!r.error,hits:r.items.length,error:r.error,runHealth:(r.error?'failed':r.items.length>0?'healthy':'low-yield') as 'healthy'|'low-yield'|'failed',recovery:r.recovery,
      value:evaluateSourceValue({ok:!r.error,hits:r.items.length,primaryItems,confirmationContributions})
    };
  });
  const adaptiveOutcomes=sourceStatus.map(s=>({
    sourceId:s.id,ok:s.ok,candidates:s.hits,unseen:results.find(r=>r.source.id===s.id)?.freshness.unseen??0,
    acceptedPrimary:s.value.primaryItems,confirmations:s.value.confirmationContributions,
    tierA:items.filter(item=>item.sourceId===s.id&&item.bidNewsRelevance?.tier==='A').length,
    tierB:items.filter(item=>item.sourceId===s.id&&item.bidNewsRelevance?.tier==='B').length,
  }));
  const coverageBudgetTelemetry=adaptiveSourcePlan.filter(p=>p.coverageCandidateBonus>0||p.coveragePriorityBonus>0).map(plan=>{
    const result=results.find(r=>r.source.id===plan.source.id);
    const extraUrls=new Set(result?.extraBudgetCandidateUrls??[]);
    const acceptedFromExtra=items.filter(item=>item.sourceId===plan.source.id&&extraUrls.has(item.url));
    const gapReasons=plan.reasons.filter(reason=>reason.startsWith('coverage budget:')||reason.startsWith('coverage exploration:'));
    return {
      sourceId:plan.source.id,sourceName:plan.source.name,lane:plan.lane,
      baseCandidateLimit:plan.baseCandidateLimit,candidateLimit:plan.candidateLimit,extraCandidateBudget:Math.max(0,plan.candidateLimit-plan.baseCandidateLimit),
      priorityBonus:plan.coveragePriorityBonus,extraCandidatesConsumed:extraUrls.size,acceptedFromExtra:acceptedFromExtra.length,
      acceptedExtraTitles:acceptedFromExtra.slice(0,3).map(item=>item.title),gapReasons,
      outcome:extraUrls.size===0?'unused':acceptedFromExtra.length>0?'productive':'used-no-accepted-yield',
    };
  });
  const coverageBudgetHistoryBefore=profile.id==='waste'?await loadCoverageBudgetHistory(90):null;
  const coverageBudgetSummary={
    boostedSources:coverageBudgetTelemetry.length,
    allocatedExtraCandidates:coverageBudgetTelemetry.reduce((n,x)=>n+x.extraCandidateBudget,0),
    consumedExtraCandidates:coverageBudgetTelemetry.reduce((n,x)=>n+x.extraCandidatesConsumed,0),
    acceptedFromExtra:coverageBudgetTelemetry.reduce((n,x)=>n+x.acceptedFromExtra,0),
    productiveSources:coverageBudgetTelemetry.filter(x=>x.outcome==='productive').length,
    unusedSources:coverageBudgetTelemetry.filter(x=>x.outcome==='unused').length,
    principle:'Extra crawl-budget mäts separat. Endast kandidater som faktiskt låg utanför ordinarie baseline räknas som extra yield; detta påverkar aldrig evidensens confidence.',
  };
  const coverageBudgetAuditSave=profile.id==='waste'?await persistCoverageBudgetAudit(coverageBudgetTelemetry,fetchedAt):null;
  const coverageBudgetHistory=profile.id==='waste'?await loadCoverageBudgetHistory(90):null;
  recordAdaptiveSourceOutcomes(adaptiveOutcomes,new Date(fetchedAt));
  const persistentSourceHealthSave=await persistSourceHealthOutcomes(adaptiveOutcomes,fetchedAt);
  const sourceHealth={healthy:sourceStatus.filter(s=>s.runHealth==='healthy').length,lowYield:sourceStatus.filter(s=>s.runHealth==='low-yield').length,failed:sourceStatus.filter(s=>s.runHealth==='failed').length,producing:sourceStatus.filter(s=>s.hits>0).length,checked:sourceStatus.length,newCandidates:sourceStatus.reduce((n,s)=>n+s.hits,0)};
  const swedishCoverageMatrix=profile.id==='waste'?buildSwedishCoverageGapMatrix(enabledSources,sourceStatus,items):[];
  const swedishCoverageSummary=profile.id==='waste'?summarizeSwedishCoverageGapMatrix(swedishCoverageMatrix):null;
  const coverageGapDiscoveryPlan=profile.id==='waste'?buildCoverageGapDiscoveryQueue(swedishCoverageMatrix,new Date(fetchedAt),4):{queue:[],countiesSelected:0,dimensionsSelected:0,maxQueries:4,principle:'Disabled outside the waste profile.'};
  const rankedCoverageGapQueue=rankGapDiscoveryQueue(coverageGapDiscoveryPlan.queue);
  const coverageGapPolicy={...newsIntakeProviderPolicy,maxQueriesPerRun:1,maxResultsPerQuery:8,maxEstimatedCostPerRun:0.01};
  const coverageGapDiscovery=await settleBefore(refreshDeadlines.total,()=>runDiscoveryOrchestrator({
    providers:configuredProviders,
    queue:rankedCoverageGapQueue.slice(0,1),
    industryKeywords:profile.keywords,
    knownUrls:[...items.map(x=>x.url),...activeDiscovery.results.map(x=>x.url),...gapDrivenDiscovery.results.map(x=>x.url)],
    maxAgeDays:90,
    policy:coverageGapPolicy,
    estimatedCostPerProviderRequest:0.01,
  }))??emptyDiscovery(Math.min(1,rankedCoverageGapQueue.length),configuredProviders.map(x=>x.id),'refresh-time-budget');
  const coverageGapFeedbackObserved=recordGapDiscoveryFeedback(rankedCoverageGapQueue,coverageGapDiscovery,new Date(fetchedAt));
  const coverageGapLearningSave=await persistDiscoveryLearningObservations(coverageGapFeedbackObserved);
  const coverageGapLearning={
    ...gapDiscoveryFeedbackSummary(),
    observed:coverageGapFeedbackObserved.length,
    persistentSaved:coverageGapLearningSave.savedObservations,
    persistenceMode:coverageGapLearningSave.enabled?'database':'memory',
    persistenceReason:coverageGapLearningSave.reason,
    principle:'Coverage discovery learns only from executed, accepted results. It may reorder the fixed four-query budget, never raise evidence confidence, and never automatically disable exploration.',
  };

  // v3.24: fixed-source articles and external discovery are weighted as one news feed.
  // This is deliberately separate from signal fusion: only source provenance and same-event
  // corroboration affect the compact evidence label on a news card.
  const discoveryForNews=[...activeDiscovery.results,...gapDrivenDiscovery.results,...coverageGapDiscovery.results]
    .filter(x=>!x.targetId.startsWith('competitor-jobs:'))
    .filter(x=>{const age=ageInDays(x.publishedAt,new Date(fetchedAt));return age!==null&&age>=0&&age<=days;})
    .map(x=>{
      const sourceType=x.evidenceQuality.originalSourceCount>0?'authority':discoveryNewsSourceType(x.targetId);
      const text=`${x.title} ${x.snippet}`;
      const relevance=profile.id==='waste'?assessBidNewsRelevance({title:x.title,text,competitors:x.competitors,geographies:x.geographies,sourceType}):null;
      return {
        title:x.title,url:x.url,source:x.source,sourceType,sourceTier:sourceType==='authority'?1:3,trustScore:sourceType==='authority'?95:60,
        publishedAt:x.publishedAt,category:classifyFeedItem(text),score:x.score,importance:x.score>=80?'Hög':x.score>=65?'Medel':'Bevaka',
        factualSummary:x.snippet||x.title,geographies:x.geographies,competitors:x.competitors,bidNewsRelevance:relevance,targetId:x.targetId,
      } satisfies EvidenceWeightedNewsInput;
    });
  const discoveredSourceNews=discoveryResults
    .filter(x=>{const age=ageInDays(x.publishedAt,new Date(fetchedAt));return age!==null&&age>=0&&age<=days;})
    .map(x=>({
      ...x,publishedAt:x.publishedAt!,sourceType:'media',sourceTier:3,trustScore:x.confidence==='hög'?75:x.confidence==='medel'?65:55,
      supportingSources:[{title:x.title,url:x.url,source:x.source,sourceId:`discovery:${x.source}`,sourceType:'media',sourceTier:3,trustScore:x.confidence==='hög'?75:x.confidence==='medel'?65:55}],
    } satisfies EvidenceWeightedNewsInput));
  const fixedNewsItems=items.map(item=>({...item,publishedAt:item.publishedAt!}) satisfies EvidenceWeightedNewsInput);
  const newsFeedItems=buildEvidenceWeightedNewsFeed([...fixedNewsItems,...discoveryForNews,...discoveredSourceNews],120);
  const persistentIntelligence=await persistIntelligenceHistory(
    fetchedAt,
    sourceStatus.map(s=>({id:s.id,name:s.name,ok:s.ok,hits:s.hits,primaryItems:s.value.primaryItems,confirmationContributions:s.value.confirmationContributions})),
    items.map(item=>({url:item.url,title:item.title,source:item.source,publishedAt:item.publishedAt!,category:item.category,score:item.score,geographies:item.geographies,competitors:item.competitors}))
  );
  const coverageSourceRecommendations=profile.id==='waste'?buildCoverageSourceRecommendations({
    rows:swedishCoverageMatrix,
    sources:enabledSources,
    sourceLearning:persistentIntelligence.sourceLearning,
    coverageHistory:persistentIntelligence.coverageSourceLearning,
    maxRecommendations:6,
  }):[];
  return NextResponse.json({
    fetchedAt,industry:{id:profile.id,label:profile.label,description:profile.description},days,totalCandidates:flattened.length,totalInPeriod:items.length,unknownDateExcluded:unknownDate,
    network:summarizeSourceNetwork(profile.sources),sourceDiversity,newsIntakeDiagnostics,newsQualitySummary,freshEventSummary,articleValidationSummary,bidNewsRelevanceSummary,newsIntake:{fixedSources:enabledSources.length,refreshRuntime:{elapsedMs:Date.now()-refreshStartedAt,totalBudgetMs:refreshDeadlines.total-refreshStartedAt,sourceBudget:refreshSourceBudget.diagnostics},adaptiveSourceCrawl:{state:{...adaptiveSourceStateSummary(),persistentLoad:persistentSourceHealthLoad.status,persistentSave:persistentSourceHealthSave,hydratedSourceHealth,coverageBudgeting:{enabled:profile.id==='waste',historicalLearning:preCrawlLearning.enabled,hints:coverageCrawlHints.length,reason:preCrawlLearning.reason,summary:coverageBudgetSummary,telemetry:coverageBudgetTelemetry,history:coverageBudgetHistory,historyBefore:coverageBudgetHistoryBefore,auditSave:coverageBudgetAuditSave}},priority:adaptiveSourcePlan.filter(x=>x.lane==='priority').length,standard:adaptiveSourcePlan.filter(x=>x.lane==='standard').length,explore:adaptiveSourcePlan.filter(x=>x.lane==='explore').length,plan:adaptiveSourcePlan.map(x=>({id:x.source.id,name:x.source.name,lane:x.lane,priorityScore:x.priorityScore,candidateLimit:x.candidateLimit,baseCandidateLimit:x.baseCandidateLimit,coverageCandidateBonus:x.coverageCandidateBonus,coveragePriorityBonus:x.coveragePriorityBonus,reasons:x.reasons}))},freshness:{state:freshnessStateSummary(),considered:results.reduce((n,x)=>n+x.freshness.considered,0),unseen:results.reduce((n,x)=>n+x.freshness.unseen,0),seenRecently:results.reduce((n,x)=>n+x.freshness.seenRecently,0),prioritizedUnseen:results.reduce((n,x)=>n+x.freshness.prioritizedUnseen,0),retainedSeenForCoverage:results.reduce((n,x)=>n+x.freshness.retainedSeenForCoverage,0)},sourceFetchConcurrency:8,articleReadConcurrency:10,clusterReadCap:72,feedItemCap:120,discoveryResultCap:60,providerPolicy:{maxQueriesPerRun:boundedDiscoveryPolicy.maxQueriesPerRun,maxResultsPerQuery:boundedDiscoveryPolicy.maxResultsPerQuery,cacheTtlHours:boundedDiscoveryPolicy.cacheTtlMs/3600000,maxEstimatedCostPerRun:boundedDiscoveryPolicy.maxEstimatedCostPerRun},newsDiscovery:summarizeNewsDiscoveryQueue(newsDiscoveryQueue),competitorNews:summarizeCompetitorNewsQueue(competitorNewsQueue,requestedActors),competitorSignals:summarizeCompetitorSignalQueue(competitorSignalQueue,requestedActors),competitorOfficialSources,competitorSourceLanes:summarizeCompetitorSourceLanes(competitorSourceLaneQueue,requestedActors),coverage:newsCoverage,coverageDrivenQueries:coverageNewsQueue.length,sourceExpansion:summarizeSourceExpansionQueue(sourceExpansionQueue),sourceExpansionQueries:sourceExpansionQueue.length,rotatingQueries:rotatingNewsQueue.length+newsBackfill.length,newsSlots:newsDiscoveryQueue.length,municipalProtocols:summarizeMunicipalProtocolDiscovery(municipalProtocolQueue),municipalProtocolSlots:municipalProtocolQueue.length,competitorJobs:summarizeCompetitorJobDiscovery(competitorJobQueue,requestedActors),competitorJobSlots:competitorJobQueue.length,publicRecords:summarizePublicRecordsDiscovery(publicRecordsQueue),publicRecordSlots:publicRecordsQueue.length,authoritySlots,combinedDiscoveryQueries:combinedDiscoveryQueue.length},authorityDiscoveryCoverage,authorityDiscoveryBatch,authoritySearchQueue,municipalProtocolQueue,competitorJobQueue,competitorJobSignals,competitorWebsiteMonitor,entityGraph,competitorEntityViews,publicRecordsQueue,ambiguousCaseHoldingArea,persistentAmbiguousCandidates,fusedSignals,signalTimelines,signalTimelineSummary,whyItMatters,whyItMattersSummary:whyItMattersSummaryPayload,sourceGaps,sourceGapSummary,gapDrivenDiscoveryPlan,gapDrivenDiscovery,gapDiscoveryFeedbackObserved,gapDiscoveryFeedback,evidencePromotion:{load:pendingEvidenceLoad.status,summary:evidencePromotionBatch.summary,marked:evidencePromotionMark,save:pendingEvidenceSave},leadTimeSummary,caseSnapshots,caseHistoryPersistence,caseEvolutions,caseEvolutionSummary,strategicDeltas,strategicDeltaSummary,evidenceDrilldowns,coolingAssessments,coolingSummary,intelligencePriorities,intelligencePrioritySummary,analystActionQueue,analystActionSummary,newsCoverage,competitorNewsQueue,competitorSignalQueue,competitorSourceLaneQueue,rotatingNewsQueue,coverageNewsQueue,sourceExpansionQueue,newsBackfill,newsDiscoveryQueue,discoveryProvider,discoveryPipeline,activeDiscovery,swedishCoverageMatrix,swedishCoverageSummary,coverageGapDiscoveryPlan:{...coverageGapDiscoveryPlan,queue:rankedCoverageGapQueue.map(q=>({jobId:q.jobId,targetId:q.targetId,targetName:q.targetName,county:q.county,intent:q.intent,query:q.query,sourceClass:q.sourceClass}))},coverageGapDiscovery,coverageGapFeedbackObserved,coverageGapLearning,coverageSourceRecommendations,sourceSuggestions,discoveryResults:[...activeDiscovery.results,...gapDrivenDiscovery.results,...coverageGapDiscovery.results,...discoveryResults].sort((a,b)=>b.score-a.score).slice(0,60),sourceHealth,sourceStatus,persistentIntelligence,
    items,
    newsFeedItems,
    note:'v2.77 låter Adaptive Source Crawl väga faktisk A/B-yield från Bid News Relevance. Källor som återkommande levererar direkt affärskritiska eller strategiskt viktiga nyheter får större kandidatbudget, medan explore-lanen fortfarande är skyddad och ingen källa stängs av automatiskt. v2.76 lägger till Bid News Relevance Calibration för avfallsprofilen: kontrakt/tilldelning, kapacitet/anläggning, tillstånd, etablering, M&A, investering och pris/materialflöden prioriteras framför allmän hållbarhet, teknik och kommunikationsnyheter. Relevans betyder arbetsvärde för marknads-/anbudsarbete, inte sannolikhet. v2.75 lägger till Source Article Validation: rubrik, URL, datum och extraherad brödtext måste vara tillräckligt konsistenta innan en träff behandlas som artikel. Kategori-/arkiv-/söksidor och tydliga datumkonflikter kan stoppas; osäkra men möjliga artiklar viktas ned. v2.74 lägger till Fresh Event Detection: Bevakly skiljer konservativt mellan ny utveckling, pågående utveckling, bakgrund/återpublicerad information och osäker freshness. Endast tydliga bakgrundsfall får freshness-straff; systemet påstår inte ett exakt händelsedatum när källan saknar ett sådant. v2.73 fortsätter nyhetskvalitet med Story Provenance & Event Dedupe: samma händelse kollapsas över närliggande rubriker/källor, direkt originalkälla prioriteras framför distributionsplattform när båda finns, och oberoende redaktionell rapportering skiljs från pressdistribution. Detta är en heuristik och inte ett påstående om journalistisk oberoende för varje enskild artikel. v2.72 fokuserar på nyhetskvalitet: en separat News Quality Gate stoppar ämnesmässigt svaga, service-/navigationslika och otillräckligt extraherade träffar innan de når nyhetsflödet. Tunt men relevant underlag behålls konservativt med score-cap. Factual summary prioriterar nu faktisk extraherad artikeltext framför kort metadata. v2.71 lägger till Analyst Action Queue: Intelligence Priority översätts till en konkret arbetskö med Granska nu, Sök kompletterande evidens, Följ beslut, Verifiera källa, Bevaka och Kan vänta. Kön är ett analytiskt arbetsstöd och utför inga externa åtgärder automatiskt. v2.70 lägger till Intelligence Priority Engine: signalstyrka, affärspåverkan, beviskedjans täckning, förändringsmomentum, recency och eventuell cooling vägs ihop till en separat prioritering för vad användaren bör granska först. Prioritet är uttryckligen inte sannolikhet och låg tolkningssäkerhet begränsar maximal prioritet. v2.69 lägger till Negative Evidence & Cooling Engine: kvarstående högprioriterade bevisluckor kan, endast när sparad case-historik faktiskt visar att luckan bestått över flera observationer och minst 30 dagar, sänka ett separat attention score. Utebliven bekräftelse behandlas uttryckligen inte som bevis mot hypotesen. Samtidigt dedupliceras Case History-materialsnapshots så refresh utan materiell förändring inte skapar falsk evolution. v2.68 lägger till Evidence Promotion Loop: accepterade gap-driven träffar sparas som pending evidens och får först i en senare analyscykel kvalificeras för ordinarie fusion. Detta stänger kedjan signal → gap → riktad sökning → väntande evidens → nästa cykels fusion utan självförstärkning i samma request. Feature flag och migration krävs för persistence. v2.67 lägger till Persistent Learning State foundation: discovery-feedback kan feature-gated läsas från och skrivas till databasen så att prioritering kan överleva cold starts. Om flagga, databas eller schema saknas faller systemet säkert tillbaka till processminne utan att bryta feeden. Migrationen ingår men är inte påstådd körd. v2.66 lägger till Discovery Feedback Loop: gap-drivna sökningar mäts på faktisk accepterad yield, faktasäkerhet och starka discovery-träffar. Lärandet används endast för att omordna queries inom samma hårda budget, aldrig för automatisk avstängning. Obeprövade mönster behåller explorationsutrymme och historiska vikter decay:ar. v2.65 lägger till Gap-Driven Discovery: högprioriterade source gaps skapar ett separat andra discovery-pass med maximalt 4 riktade queries och ett separat kostnadstak på 0.04 per körning. Träffarna visas som kompletterande discovery men får inte tyst ändra aktuell fusion i samma pass; de måste passera ordinarie kvalitetsflöde i nästa analyscykel. v2.64 lägger till Source Gap Detection: för varje robust förändringshypotes jämförs aktuell beviskedja med förväntade bevisområden och Bevakly pekar ut saknade källtyper, prioritet och nästa bästa sökning. Systemet påstår inte att en källa saknas i verkligheten, bara att den saknas i Bevaklys aktuella underlag. v2.63 lägger till Why It Matters Engine: robusta förändringar får en regelbaserad konsekvensanalys för marknad, konkurrent och egen verksamhet, strikt separerad från fakta. Bedömningen använder hypothesis, signalstyrka, oberoende källor och process-steg men antar aldrig ekonomisk effekt, volym eller tidplan om detta saknas i underlaget. v2.62 lägger till Case Evolution Engine: snapshots jämförs över tid och översätts till score-delta, fact-delta, stage-förflyttning, riktningsbyte och nya källtyper. Om persistent case history är aktiv läses tidigare snapshots från databasen; annars visas endast aktuell körning och systemet säger uttryckligen att jämförelse över tid saknas. v2.61 lägger grunden för Persistent Case History: varje robust Signal Timeline får ett stabilt caseKey och ett snapshot med observedAt, evidence first/latest seen, stage, direction, score, facts och source classes. En separat DB-adapter och migration finns, men persistence är feature-gated via BEVAKLY_CASE_HISTORY_ENABLED=true och schema-probas innan skrivning. Releasen påstår därför inte att migrationen är körd eller att persistent firstSeen är live. v2.60 lägger till Intelligence Lead-Time Score: för varje aktuell beviskedja mäts tiden från första klassade tidiga signal till senare nyhet, beslut eller genomförandemilstolpe när sådan bekräftelse faktiskt finns. Måttet kallas uttryckligen current evidence-chain lead time och gör inget anspråk på historisk produkt-detection-time innan persistent first-seen lagring verifierats. v2.59 lägger till Bevakly Daily: en kompakt beslutsbrief med tre viktigaste förändringar, stärkta signaler, konkurrentfokus och vad som bör bevakas idag; tomt robust underlag ger tom brief i stället för utfyllnad. v2.58 lägger till Ask Bevakly: en källgrundad frågevy som svarar från aktuell Signal Timeline och lokalt följda förändringar, visar underlaget och avstår när stödet saknas. Ingen fri AI-gissning eller extern LLM används i denna första version. v2.57 lägger till klientbaserad ”Följ denna förändring”: signaler kan sparas per bevakningsprofil och jämföras mot senare feed-körningar via stabilt entity-first caseKey. Status kan stärkas, vara stabil, försvagas eller sakna ny träff beroende på score, fakta, process-steg och cooling. Detta är uttryckligen browserlokalt och ingen serverpersistent bevakning påstås. v2.56 lägger till Entity & Relationship Graph: konkurrentnamn normaliseras mot en explicit aliasregistry och aktuella discovery-observationer byggs till relationer mellan organisation, geografi, signaltyp och källa. Signal Fusion har samtidigt fått ett anti-bridge-skydd: två olika namngivna konkurrenter i samma geografi får inte längre kopplas ihop enbart via orten. Grafen bygger endast relationer som faktiskt observerats i aktuell körning; inga dotterbolag eller anläggningar gissas. v2.55 lägger till Competitor Website Change Detection: verifierade officiella konkurrentwebbplatser och karriärsidor får processlokala snapshots, SHA-256-fingeravtryck, before/after-diff, förändringsgrad och strategiska termförändringar. Redirects utanför explicit allowlist stoppas och första hämtningen skapar bara baseline – den får aldrig beskrivas som en förändring. Persistence är uttryckligen processlokal tills databaspersistence verifierats. v2.54 lägger till Konkurrentkort 2.0 i konkurrentspåret: aktuell discovery, jobbannonser, fusionerade förändringssignaler, signalstyrka och öppningsbar beviskedja samlas per bevakad aktör. En ensam jobbannons eller offentlig handling visas som fakta men räcker inte för att påstå strategisk förflyttning. v2.53 gör signalmaskineriet användarnära i huvudflödet: API:t fortsätter leverera fusioner/tidslinjer och klienten visar nu ”Vad håller på att hända?” med viktigaste förändringar, stärkta signaler, konkurrentfokus och öppningsbar beviskedja. v2.52 lägger till Signal Timeline & Escalation: fusioner får kronologiska milstolpar, steg från första signal till genomförande, eskaleringspoäng samt escalating/stable/cooling. Denna release gör uttryckligen inte anspråk på persistent cross-run timeline innan production-databasen är verifierad. v2.51 lägger till Signal Fusion: discovery-signaler från nyheter, kommunprotokoll, jobbannonser och offentliga register kan grupperas till en gemensam förändringshypotes när de delar konkurrent eller stark geografi/strategisk kontext inom 45 dagar. Minst två distinkta källklasser krävs; hög tolkning kräver minst tre källklasser och tre distinkta källor. En ensam jobbannons kan aldrig skapa en fusion. v2.50 lägger till Public Records Intelligence och Competitor Job Radar med verifierade officiella värdar. v2.49 lägger till Municipal Protocol Radar: ett eget discovery-spår för verifierade kommunala protokoll, ärendelistor, tjänsteutlåtanden och nämndhandlingar. Resultat måste ligga på en explicit verifierad officiell kommunvärd; domäner gissas aldrig. Första verifierade täckningen är Örebro, Stockholm och Göteborg och arkitekturen är utbyggbar till fler kommuner. PDF-/protokolldatum kan räddas från rubrik eller URL innan vanlig metadata-recovery. v2.48 lägger till Adaptive Source Crawl: fasta källor rangordnas försiktigt efter observerad stabilitet, andel nya kandidater och faktiska primär-/bekräftelsebidrag. Alla aktiverade källor fortsätter bevakas, ingen källa stängs av automatiskt och ett särskilt utforskningsspår skyddar nya/lågobserverade källor. Högproduktiva källor får större kandidatfönster före downstream-taken. State är processlokal och markeras icke-persistent. v2.47 lägger till Freshness & Incremental Crawl: feed-/sitemap-/listningskandidater prioriteras efter om URL:en setts nyligen, med 45 dagars bounded minnesstate och återfyllnad av redan sedda kandidater så att det aktuella flödet inte blir tomt. State är medvetet processlokal och markeras som icke-persistent tills Neon-persistence är verifierad. v2.46 lägger till Feed & Sitemap Discovery: deklarerade RSS/Atom-flöden, robots.txt-sitemaps och bounded sitemap-index kan komplettera svaga listningssidor. v2.45 lägger till Article Extraction Recovery: JSON-LD articleBody, <article>/<main>-extraktion, konservativ paragraf-fallback, metadatafallback och diagnostik per extraktionsmetod. v2.44 lägger till Source Failure Recovery: transient retry, säker fallback till källans bas-URL och RSS/Atom-autodiscovery när en hämtad listningssida ger noll kandidater. Recovery redovisas per källa och i intake-diagnostiken. v2.43 lägger till Intake Recovery Engine: bredare datumextraktion, URL-datumfallback och ett strikt begränsat andra försök mot originalartikeln för providerträffar som annars skulle falla på saknat datum eller tunn metadata. v2.42 lägger till stegvis News Intake Diagnostics för att visa exakt var nyheter tappas i fasta källor och extern discovery. v2.41 ökar genomströmningen i nyhetsintaget: fler providerträffar per fråga, fler nyhetssökningar, större artikel-/feedtak och större discovery-resultatfönster, samtidigt som datum-, relevans-, dedupe- och evidenskraven ligger kvar. Nyhetsinsamlingen använder nu ett roterande News Discovery-spår, en adaptiv Coverage Engine och separata discovery-banor för lokal/regional media, konkurrentägda källor, svensk branschmedia och internationella nyheter med svensk relevans som styr sökningar mot underbevakade ämnen och konkurrenter, parallellt med myndighets- och kommunradarn. Endast händelser med identifierbart publiceringsdatum visas. Myndighets- och kommun-discovery använder en begränsad daglig rotationsbatch; sökjobb som saknar direkt källa exponeras som kö men körs inte utan en riktig sökprovider. Discovery prioriterar nu även tidiga försignaler som samråd, tillstånd, mark/bygglov, kapacitet, rekrytering och myndighetsärenden. Liknande rubriker klustras. Flera domäner räknas inte längre automatiskt som oberoende bekräftelse när publiceringarna sannolikt bygger på samma ursprung. Nya källor visas som discovery-träffar och källförslag men läggs inte automatiskt till i den permanenta bevakningen.'
  });
}
