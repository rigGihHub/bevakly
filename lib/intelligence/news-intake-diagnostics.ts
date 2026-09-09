export type FixedSourceIntakeDiagnostics={
  configuredSources:number;
  sourceFetchOk:number;
  sourceFetchFailed:number;
  sourceRecoveryAttempted:number;
  sourceRecovered:number;
  sourceRecoveredByRetry:number;
  sourceRecoveredByBase:number;
  sourceRecoveredByFeed:number;
  sourceRecoveredBySitemap:number;
  structuredDiscoveryRequests:number;
  feedCandidatesRecovered:number;
  sitemapCandidatesRecovered:number;
  rawCandidates:number;
  clustersConsidered:number;
  missingPrimary:number;
  articleReadAttempted:number;
  articleReadOk:number;
  articleReadFailed:number;
  dateRecoveredFromArticle:number;
  dateRecoveredFromUrl:number;
  missingOrInvalidDate:number;
  outsideSelectedPeriod:number;
  acceptedInPeriod:number;
  articleExtractionRecovered:number;
  articleExtractionThin:number;
  articleExtractionMethods:Record<string,number>;
};

export type DiscoveryIntakeDiagnostics={
  queuedJobs:number;
  executedQueries:number;
  providerRequests:number;
  cacheHits:number;
  providerHits:number;
  processedResults:number;
  acceptedBeforeDedupe:number;
  rejected:number;
  hostRejected:number;
  dedupeDropped:number;
  recoveryAttempted:number;
  recoverySucceeded:number;
  recoveredAccepted:number;
  accepted:number;
  rejectionReasons:Record<string,number>;
};

function percent(part:number,total:number){return total>0?Math.round((part/total)*1000)/10:0;}

export function buildNewsIntakeDiagnostics(input:{fixed:FixedSourceIntakeDiagnostics;discovery:DiscoveryIntakeDiagnostics}){
  const f=input.fixed,d=input.discovery;
  const fixedLosses=[
    {stage:'Källhämtning',lost:f.sourceFetchFailed,base:f.configuredSources},
    {stage:'Artikelhämtning',lost:f.articleReadFailed,base:f.articleReadAttempted},
    {stage:'Datum saknas/ogiltigt',lost:f.missingOrInvalidDate,base:f.clustersConsidered},
    {stage:'Utanför vald period',lost:f.outsideSelectedPeriod,base:f.clustersConsidered},
  ].map(x=>({...x,lossRate:percent(x.lost,x.base)}));
  const discoveryLosses=[
    {stage:'Utanför verifierad officiell kommunvärd',lost:d.hostRejected,base:d.providerHits,lossRate:percent(d.hostRejected,d.providerHits)},
    ...Object.entries(d.rejectionReasons).map(([stage,lost])=>({stage,lost,base:d.processedResults,lossRate:percent(lost,d.processedResults)})),
    {stage:'Deduplicering',lost:d.dedupeDropped,base:d.acceptedBeforeDedupe,lossRate:percent(d.dedupeDropped,d.acceptedBeforeDedupe)},
  ];
  const all=[...fixedLosses,...discoveryLosses].filter(x=>x.lost>0).sort((a,b)=>b.lost-a.lost||b.lossRate-a.lossRate);
  return {
    fixed:{...f,sourceSuccessRate:percent(f.sourceFetchOk,f.configuredSources),sourceRecoveryYield:percent(f.sourceRecovered,f.sourceRecoveryAttempted),articleReadSuccessRate:percent(f.articleReadOk,f.articleReadAttempted),candidateToFeedRate:percent(f.acceptedInPeriod,f.rawCandidates),articleExtractionYield:percent(f.articleExtractionRecovered,f.articleReadOk),thinArticleRate:percent(f.articleExtractionThin,f.articleReadOk),recoveredDates:f.dateRecoveredFromArticle+f.dateRecoveredFromUrl},
    discovery:{...d,queryExecutionRate:percent(d.executedQueries,d.queuedJobs),providerHitAcceptanceRate:percent(d.accepted,d.providerHits),recoveryYield:percent(d.recoveredAccepted,d.recoveryAttempted)},
    biggestLosses:all.slice(0,8),
    bottleneck:all[0]??null,
  };
}
