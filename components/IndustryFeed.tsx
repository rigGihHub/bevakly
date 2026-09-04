'use client';
import { useEffect,useMemo,useState } from 'react';
import { Bookmark, CalendarDays, ExternalLink, Filter, Globe2, Newspaper, RefreshCw, ShieldCheck, Database, Radar, Sparkles, ThumbsDown, ThumbsUp, RotateCcw, SlidersHorizontal, Sunrise, ArrowRight, CheckCircle2, Eye, Activity, Landmark, Factory, Cpu, Scale } from 'lucide-react';
import { buildFeedback, feedbackSummary, personalScore, stableItemKey, type FeedbackKind, type FeedbackRecord } from '@/lib/intelligence/personal-relevance';
import { buildMorningBrief } from '@/lib/intelligence/morning-brief';
import { profileMatch, type WatchProfile } from '@/lib/intelligence/watch-profiles';
import { explainImpact } from '@/lib/intelligence/impact-explanation';
import { buildStoryClusters } from '@/lib/intelligence/story-clusters';
import { detectNovelty } from '@/lib/intelligence/novelty';
import { buildTopicTimelines } from '@/lib/intelligence/topic-timelines';
import { classifyLocalSignal } from '@/lib/intelligence/local-signals';
import { buildLocalMarketRadar, buildMunicipalityRadar } from '@/lib/intelligence/geographic-intelligence';
import { appendSourceLearningHistory, buildSourceLearning, type SourceLearningObservation } from '@/lib/intelligence/source-learning';
import type { HistoricalChange } from '@/lib/intelligence/historical-change';
import type { CompetitorBaseline } from '@/lib/intelligence/competitor-baseline';
import { buildDecisionBrief } from '@/lib/intelligence/decision-brief';
import { buildAnalystBrief } from '@/lib/intelligence/analyst-brief';
import { buildMarketDirections } from '@/lib/intelligence/market-directions';

type EvidenceQuality={rawSourceCount:number;distinctDomains:number;independentOrigins:number;originalSourceCount:number;republisherCount:number;quality:'Svagt'|'Medel'|'Starkt';label:string;reasons:string[];originGroups:{originKey:string;members:string[];likelyOriginal:string|null}[]};
type Item={title:string;url:string;source:string;sourceType:string;sourceScope:string;sourceTier:number;sourceCount:number;independentSourceCount:number;distinctDomainCount:number;confirmingSources:string[];evidenceQuality:EvidenceQuality;evidence:string;publishedAt:string;category:string;score:number;importance:string;factualSummary:string;geographies:string[];competitors:string[];articleReadOk:boolean};
type SourceValue={score:number;label:'Hög'|'Medel'|'Under observation';primaryItems:number;confirmationContributions:number;reasons:string[];limitation:string};
type SourceStatus={id:string;name:string;type:string;scope:string;tier:number;description:string;ok:boolean;hits:number;error?:string;value:SourceValue};
type SourceSuggestion={domain:string;homepage:string;score:number;confidence:'hög'|'medel'|'låg';occurrences:number;discoveredFrom:string[];matchedKeywords:string[];sampleLinks:{title:string;url:string}[];reasons:string[];status:'föreslagen'};
type PersistentIntelligence={enabled:boolean;savedSourceRuns:number;savedEventObservations:number;sourceLearning:ReturnType<typeof buildSourceLearning>;historicalChanges:HistoricalChange[];competitorBaselines:CompetitorBaseline[];reason:string|null};
type DiscoveryItem={title:string;url:string;source:string;publishedAt:string;category:string;score:number;importance:string;factualSummary:string;geographies:string[];competitors:string[];keywordHits:string[];confidence:'hög'|'medel'|'låg';earlySignal?:{type:string;strength:'svag'|'medel'|'stark';reason:string;watchNext:string;matchedTerms:string[]};status:'discovery'};
type Payload={fetchedAt:string;persistentIntelligence:PersistentIntelligence;industry:{id:string;label:string;description:string};days:number;totalCandidates:number;totalInPeriod:number;unknownDateExcluded:number;network:{enabled:number;tier1:number;tier2:number;tier3:number;byScope:Record<string,number>};authorityDiscoveryCoverage?:{totalTargets:number;municipalityTargets:number;countyTargets:number;activeTargets:number;uncoveredTargets:number;activeMunicipalities:number;activeCounties:number;intentCounts:Record<string,number>;sampleGaps:Array<{id:string;name:string;kind:string;county:string|null;queryHints:string[]}>};authorityDiscoveryBatch?:{batchKey:string;maxJobs:number;directSourceJobs:number;searchRequiredJobs:number;representedCounties:number;municipalityJobs:number;authorityJobs:number;jobs:Array<{id:string;targetId:string;targetName:string;kind:string;county?:string;priority:string;intent:string;query:string;activeSourceIds:string[];mode:'direct-source'|'search-required'}>};authoritySearchQueue?:Array<{jobId:string;targetId:string;targetName:string;county:string|null;intent:string;query:string;requiredFields:readonly string[]}>;discoveryProvider?:{providerConnected:boolean;cache:string;cacheTtlHours:number;maxQueriesPerRun:number;maxResultsPerQuery:number;retryCount:number;backoff:string;maxEstimatedCostPerRun:number;failoverReady:boolean;providerAdapters:Array<{id:string;configured:boolean;envKey:string}>;health:Array<{providerId:string;status:string;totalRequests:number;successRate:number;averageLatencyMs:number;consecutiveFailures:number}>};discoveryPipeline?:{ready:boolean;canonicalization:string;qualityGate:string;earlySignal:string;entityMatching:string;dedupe:string;evidence:string;providerConnected:boolean;canonicalUrlExample:string};activeDiscovery?:{status:'waiting-for-provider'|'completed'|'budget-stopped';configuredProviders:string[];queuedJobs:number;executedQueries:number;providerRequests:number;cacheHits:number;estimatedCost:number;accepted:number;rejected:number;stoppedReason:string|null};sourceStatus:SourceStatus[];sourceSuggestions:SourceSuggestion[];discoveryResults:DiscoveryItem[];items:Item[];note:string};
const periods=[{d:1,l:'24 timmar'},{d:3,l:'3 dagar'},{d:7,l:'7 dagar'},{d:30,l:'30 dagar'}];
const storageKey=(profileId:string)=>`bevakly:relevance:v2:${profileId}`;
const visitKey=(profileId:string)=>`bevakly:last-visit:v2:${profileId}`;
const visitSessionKey=(profileId:string)=>`bevakly:visit-session:v2:${profileId}`;
const seenKey=(profileId:string)=>`bevakly:seen:v1:${profileId}`;
const sourceLearningKey=(industry:string)=>`bevakly:source-learning:v1:${industry}`;
function date(v:string){return new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
function scopeLabel(scope:string){return scope==='sweden'?'Sverige':scope==='eu'?'EU':scope==='nordic'?'Norden':'Internationellt';}
function feedbackLabel(kind:FeedbackKind){return kind==='important'?'Viktigt':kind==='irrelevant'?'Ointressant':'Följ detta';}
export default function IndustryFeed({industry,customIndustry,profile}:{industry:string;customIndustry?:string;profile:WatchProfile}){
 const [days,setDays]=useState(7),[category,setCategory]=useState('Alla'),[data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[showSources,setShowSources]=useState(false),[showSuggestions,setShowSuggestions]=useState(false),[ranking,setRanking]=useState<'personal'|'latest'>('personal'),[feedback,setFeedback]=useState<FeedbackRecord[]>([]),[feedbackReady,setFeedbackReady]=useState(false),[visitWindow,setVisitWindow]=useState<{since:string;until:string;first:boolean}|null>(null),[seen,setSeen]=useState<string[]>([]),[showRead,setShowRead]=useState(false),[sourceLearningHistory,setSourceLearningHistory]=useState<SourceLearningObservation[]>([]);
 const load=async()=>{setLoading(true);setError(null);try{const qs=new URLSearchParams({industry,days:'30'});if(customIndustry)qs.set('custom',customIndustry);const r=await fetch(`/api/industry-feed?${qs}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);setData(await r.json())}catch(e){setError(e instanceof Error?e.message:'Kunde inte hämta branschflödet')}finally{setLoading(false)}};
 useEffect(()=>{void load()},[industry,customIndustry]);
 useEffect(()=>{
   try{
     const existing=sessionStorage.getItem(visitSessionKey(profile.id));
     if(existing){setVisitWindow(JSON.parse(existing));return;}
     const until=new Date(); const raw=localStorage.getItem(visitKey(profile.id));
     const parsed=raw?new Date(raw):null; const valid=parsed&&!Number.isNaN(parsed.getTime());
     const floor=new Date(until.getTime()-30*86400000); const fallback=new Date(until.getTime()-86400000);
     const since=valid?(parsed!<floor?floor:parsed!):fallback; const window={since:since.toISOString(),until:until.toISOString(),first:!valid};
     sessionStorage.setItem(visitSessionKey(profile.id),JSON.stringify(window)); localStorage.setItem(visitKey(profile.id),until.toISOString()); setVisitWindow(window);
   }catch{const until=new Date();setVisitWindow({since:new Date(until.getTime()-86400000).toISOString(),until:until.toISOString(),first:true});}
 },[profile.id]);
 useEffect(()=>{try{const raw=localStorage.getItem(storageKey(profile.id));setFeedback(raw?JSON.parse(raw):[])}catch{setFeedback([])}finally{setFeedbackReady(true)}},[profile.id]);
 useEffect(()=>{if(!feedbackReady)return;try{localStorage.setItem(storageKey(profile.id),JSON.stringify(feedback.slice(-200)))}catch{}},[feedback,feedbackReady,profile.id]);
 useEffect(()=>{try{const raw=localStorage.getItem(seenKey(profile.id));setSeen(raw?JSON.parse(raw):[])}catch{setSeen([])}},[profile.id]);
 useEffect(()=>{try{localStorage.setItem(seenKey(profile.id),JSON.stringify(seen.slice(-1000)))}catch{}},[seen,profile.id]);
 useEffect(()=>{try{const raw=localStorage.getItem(sourceLearningKey(industry));setSourceLearningHistory(raw?JSON.parse(raw):[])}catch{setSourceLearningHistory([])}},[industry]);
 useEffect(()=>{
   if(!data?.sourceStatus?.length||data?.persistentIntelligence?.enabled)return;
   const observedAt=new Date().toISOString();
   const observations:SourceLearningObservation[]=data.sourceStatus.map(s=>({sourceId:s.id,observedAt,ok:s.ok,hits:s.hits,primaryItems:s.value.primaryItems,confirmationContributions:s.value.confirmationContributions}));
   setSourceLearningHistory(prev=>{
     const next=appendSourceLearningHistory(prev,observations);
     try{localStorage.setItem(sourceLearningKey(industry),JSON.stringify(next))}catch{}
     return next;
   });
 },[data?.fetchedAt,industry]);
 const profileItems=useMemo(()=>{
   return (data?.items??[]).map(item=>({item,focus:profileMatch(item,profile)})).filter(x=>x.focus.matches);
 },[data,profile]);
 const categories=useMemo(()=>{const cutoff=Date.now()-days*86400000;return ['Alla',...new Set(profileItems.filter(x=>new Date(x.item.publishedAt).getTime()>=cutoff).map(x=>x.item.category))]},[profileItems,days]);
 const ranked=useMemo(()=>{
   const cutoff=Date.now()-days*86400000;
   const base=profileItems.filter(x=>new Date(x.item.publishedAt).getTime()>=cutoff).filter(x=>category==='Alla'||x.item.category===category).map(({item,focus})=>{const personal=personalScore(item,feedback);return {item,focus,personal:{...personal,score:Math.min(100,personal.score+focus.bonus)}}});
   if(ranking==='latest') return base.sort((a,b)=>new Date(b.item.publishedAt).getTime()-new Date(a.item.publishedAt).getTime()||b.item.score-a.item.score);
   return base.sort((a,b)=>b.personal.score-a.personal.score||new Date(b.item.publishedAt).getTime()-new Date(a.item.publishedAt).getTime());
 },[profileItems,category,feedback,ranking,days]);
 const unseenProfileItems=useMemo(()=>profileItems.filter(x=>!seen.includes(stableItemKey(x.item.url))),[profileItems,seen]);
 const brief=useMemo(()=>visitWindow?buildMorningBrief(unseenProfileItems.map(x=>x.item),visitWindow.since,visitWindow.until,feedback,5):null,[unseenProfileItems,visitWindow,feedback]);
 const storyClusters=useMemo(()=>buildStoryClusters(profileItems.map(x=>x.item),5),[profileItems]);
 const topicTimelines=useMemo(()=>buildTopicTimelines(profileItems.map(x=>x.item),5),[profileItems]);
 const visiblePeriodCount=useMemo(()=>{const cutoff=Date.now()-days*86400000;return profileItems.filter(x=>new Date(x.item.publishedAt).getTime()>=cutoff).length},[profileItems,days]);
 const marketPulse=useMemo(()=>{
   const cutoff=Date.now()-7*86400000;
   const items=profileItems.map(x=>x.item).filter(x=>new Date(x.publishedAt).getTime()>=cutoff);
   const count=(terms:string[])=>items.filter(x=>terms.some(t=>x.category.toLowerCase().includes(t)||x.title.toLowerCase().includes(t))).length;
   return {
     total:items.length,
     high:items.filter(x=>x.score>=75).length,
     regulation:count(['regel','politik','lag','myndighet']),
     investment:count(['invest','anlägg','etabler','förvärv','m&a']),
     technology:count(['tekn','innovation','digital','ai','forsk']),
     media:items.filter(x=>x.sourceType==='media').length,
     local:items.filter(x=>classifyLocalSignal(x)).length,
     independent:items.filter(x=>x.independentSourceCount>1).length,
   };
 },[profileItems]);
 const latestHeadlines=useMemo(()=>profileItems.map(x=>x.item).sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()).slice(0,8),[profileItems]);
 const localSignals=useMemo(()=>profileItems.map(x=>({item:x.item,signal:classifyLocalSignal(x.item)})).filter(x=>x.signal).sort((a,b)=>new Date(b.item.publishedAt).getTime()-new Date(a.item.publishedAt).getTime()).slice(0,6),[profileItems]);
 const localMarketRadar=useMemo(()=>buildLocalMarketRadar(profileItems.map(x=>x.item)),[profileItems]);
 const municipalityRadar=useMemo(()=>buildMunicipalityRadar(profileItems.map(x=>x.item)),[profileItems]);
 const sourceLearning=useMemo(()=>data?.persistentIntelligence?.sourceLearning?.length?data.persistentIntelligence.sourceLearning:buildSourceLearning(sourceLearningHistory),[data?.persistentIntelligence?.sourceLearning,sourceLearningHistory]);
 const sourceLearningMap=useMemo(()=>new Map(sourceLearning.map(x=>[x.sourceId,x])),[sourceLearning]);
 const decisionBrief=useMemo(()=>buildDecisionBrief(profileItems.map(x=>x.item),3),[profileItems]);
 const analystBrief=useMemo(()=>buildAnalystBrief(profileItems.map(x=>x.item),data?.persistentIntelligence?.historicalChanges??[],data?.persistentIntelligence?.competitorBaselines??[],5),[profileItems,data?.persistentIntelligence?.historicalChanges,data?.persistentIntelligence?.competitorBaselines]);
 const marketDirections=useMemo(()=>buildMarketDirections(profileItems.map(x=>x.item),4),[profileItems]);
 const currentFeedback=(item:Item)=>feedback.findLast(x=>x.itemKey===stableItemKey(item.url))?.kind;
 const react=(item:Item,kind:FeedbackKind)=>setFeedback(prev=>{
   const key=stableItemKey(item.url); const last=[...prev].reverse().find(x=>x.itemKey===key);
   if(last?.kind===kind) return prev.filter(x=>x.itemKey!==key);
   return [...prev.filter(x=>x.itemKey!==key),buildFeedback(item,kind)];
 });
 const summary=feedbackSummary(feedback);
 const isSeen=(item:Item)=>seen.includes(stableItemKey(item.url));
 const markSeen=(item:Item)=>setSeen(prev=>{const key=stableItemKey(item.url);return prev.includes(key)?prev:[...prev,key]});
 const markVisibleSeen=()=>setSeen(prev=>[...new Set([...prev,...ranked.map(x=>stableItemKey(x.item.url))])]);
 const visibleRanked=showRead?ranked:ranked.filter(x=>!isSeen(x.item));
 return <section className='industryFeed'>
  <div className='feedHeader'><div><p className='eyebrow'><Newspaper size={14}/> BRANSCHFLÖDET</p><h2>Vad har hänt i {profile.name}?</h2><p>{data?.industry.label??'Bransch'} · {profile.market}. Profilen fokuserar på {profile.themes.slice(0,3).join(', ')||'bred omvärldsbevakning'}.</p></div><button className='filterButton' onClick={()=>void load()} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/>{loading?'Hämtar':'Uppdatera'}</button></div>
  <div className='feedControls'><div className='periodTabs'>{periods.map(p=><button className={days===p.d?'active':''} key={p.d} onClick={()=>setDays(p.d)}>{p.l}</button>)}</div><div className='feedSelect'><Filter size={14}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div></div>
  {error&&<div className='sourceError'>Branschflödet svarade inte: {error}</div>}

  {data&&<section className='analystBrief'>
    <div className='analystBriefHead'><div><p className='eyebrow'><Sparkles size={14}/> VAD HAR FAKTISKT FÖRÄNDRATS?</p><h3>{analystBrief.length?`${analystBrief.length} slutsatser värda att ta med sig`:'Ingen tydlig förändring ännu'}</h3><p>Bevakly prioriterar avvikelser mot historiken och konkreta konkurrentförändringar framför vanlig nyhetsvolym.</p></div><span>Analys · senaste 30 d</span></div>
    {analystBrief.length>0?<div className='analystBriefList'>{analystBrief.map((finding,i)=><article className='analystFinding' key={finding.id}>
      <div className='analystFindingIndex'>{i+1}</div>
      <div className='analystFindingBody'>
        <div className='analystFindingMeta'><span>{finding.kind}</span><b className={`geoConfidence geo-${finding.confidence.toLowerCase()}`}>{finding.confidence} säkerhet</b></div>
        <h4>{finding.headline}</h4>
        <p><strong>Fakta:</strong> {finding.fact}</p>
        <p><strong>Bevakly bedömer:</strong> {finding.interpretation}</p>
        <p className='analystWatch'><strong>Följ nu:</strong> {finding.watchNext}</p>
        {finding.links.length>0&&<div className='analystEvidence'>{finding.links.map(link=><a href={link.url} target='_blank' rel='noreferrer' key={link.url}>{link.title}{link.source?` · ${link.source}`:''}<ExternalLink size={11}/></a>)}</div>}
      </div>
    </article>)}</div>:<div className='analystEmpty'><strong>Bevakly ser ingen robust avvikelse i underlaget just nu.</strong><span>Det är bättre än att fylla sidan med svaga slutsatser. Fortsatt insamling och discovery kan förändra bilden.</span></div>}
    <small className='storyClusterNote'>FAKTA och BEVAKLY BEDÖMER hålls isär. En avvikelse eller tidig signal är inte samma sak som en bekräftad strategiförändring.</small>
  </section>}

  {data&&marketDirections.length>0&&<section className='marketDirections'>
    <div className='marketDirectionsHead'><div><p className='eyebrow'><Radar size={14}/> VAD BETYDER DET FÖR MARKNADEN?</p><h3>Riktningar som börjar synas i flera händelser</h3><p>En enskild nyhet är sällan en trend. Här grupperar Bevakly separata signaler och visar bara riktningar som återkommer i underlaget.</p></div><span>{marketDirections.length} riktningar</span></div>
    <div className='marketDirectionGrid'>{marketDirections.map(direction=><article className='marketDirectionCard' key={direction.id}>
      <div className='marketDirectionTop'><span>{direction.status}</span><b className={`geoConfidence geo-${direction.confidence.toLowerCase()}`}>{direction.confidence} säkerhet</b></div>
      <h4>{direction.label}</h4>
      <p><strong>Underlaget:</strong> {direction.summary}</p>
      <p><strong>Det kan betyda:</strong> {direction.meaning}</p>
      <p className='marketDirectionWatch'><strong>Bevaka nästa:</strong> {direction.watchNext}</p>
      <div className='marketDirectionEvidence'>{direction.evidence.slice(0,3).map(e=><a href={e.url} target='_blank' rel='noreferrer' key={e.url}>{e.title}<small>{e.source}</small><ExternalLink size={11}/></a>)}</div>
    </article>)}</div>
    <small className='storyClusterNote'>Riktning betyder återkommande signaler i Bevaklys underlag – inte en prognos. Svaga signaler ska följas och bekräftas över tid, inte behandlas som säkra framtidsutsagor.</small>
  </section>}

  {data&&decisionBrief.length>0&&<section className='decisionBrief'>
    <div className='decisionBriefHead'><div><p className='eyebrow'><Sparkles size={14}/> DET HÄR BÖR DU BRY DIG OM</p><h3>Tre saker värda din tid just nu</h3><p>Inte flest nyheter – de händelser Bevakly bedömer har störst chans att faktiskt påverka marknaden eller en bevakad aktör.</p></div><span>ca 5 min</span></div>
    <div className='decisionBriefGrid'>{decisionBrief.map((brief,i)=><article className='decisionBriefCard' key={brief.url}><div className='decisionBriefTop'><span>#{i+1} · {brief.badge}</span><b>{brief.score}/100</b></div><h4>{brief.title}</h4><p><strong>Varför:</strong> {brief.reason}</p><p><strong>Följ:</strong> {brief.watchNext}</p><small>{brief.evidence}</small><a href={brief.url} target='_blank' rel='noreferrer'>{brief.source} <ExternalLink size={12}/></a></article>)}</div>
  </section>}

  {data&&<section className='marketPulse'>
    <div className='marketPulseHead'><div><p className='eyebrow'><Activity size={14}/> AKTIVITET I UNDERLAGET</p><h3>Branschpuls senaste 7 dagarna</h3><p>Bakgrundsdata efter analysen ovan. Volym i sig är inte en slutsats.</p></div><span>{marketPulse.total} relevanta händelser</span></div>
    <div className='marketPulseGrid'>
      <div><Activity size={16}/><strong>{marketPulse.high}</strong><span>hög prioritet</span></div>
      <div><Scale size={16}/><strong>{marketPulse.regulation}</strong><span>regler & politik</span></div>
      <div><Factory size={16}/><strong>{marketPulse.investment}</strong><span>investeringar & etableringar</span></div>
      <div><Cpu size={16}/><strong>{marketPulse.technology}</strong><span>teknik & innovation</span></div>
      <div><Newspaper size={16}/><strong>{marketPulse.media}</strong><span>redaktionella träffar</span></div>
      <div><Landmark size={16}/><strong>{marketPulse.local}</strong><span>lokala signaler</span></div>
      <div><ShieldCheck size={16}/><strong>{marketPulse.independent}</strong><span>oberoende källstöd</span></div>
    </div>
    {localSignals.length>0&&<div className='localSignalRadar'><div className='latestHeadlinesTitle'><Radar size={15}/><strong>Lokal marknadsradar</strong><span>vad som faktiskt förändras geografiskt i källunderlaget</span></div>
   <div className='geoRadarSummary'><span><strong>{localMarketRadar.current30}</strong> lokala signaler senaste 30 d</span><span><strong>{localMarketRadar.previous30}</strong> föregående 30 d</span><small>Aktivitet är inte samma sak som strategi. Öppna underlaget innan du drar slutsatser.</small></div>
   {municipalityRadar.changes.length>0&&<div className='municipalityRadar'><div className='municipalityRadarHead'><strong>Kommunradar</strong><span>{municipalityRadar.current30} säkert kommunidentifierade signaler senaste 30 d</span></div><div className='municipalityGrid'>{municipalityRadar.changes.slice(0,6).map(change=><div className='municipalityCard' key={change.label}><div><strong>{change.label}</strong><span className={`geoConfidence geo-${change.confidence.toLowerCase()}`}>{change.confidence}</span></div><p><b>{change.current30}</b> nu · {change.previous30} föregående period {change.delta!==0&&<em>{change.delta>0?`+${change.delta}`:change.delta}</em>}</p><small>{change.assessment}</small>{change.signalTypes.length>0&&<span>{change.signalTypes.slice(0,3).join(' · ')}</span>}{change.actors.length>0&&<span>Aktörer: {change.actors.slice(0,3).join(', ')}</span>}</div>)}</div></div>}
   {localMarketRadar.changes.length>0&&<div className='geoChangeGrid'>{localMarketRadar.changes.slice(0,4).map(change=><div className='geoChangeCard' key={change.label}><div><strong>{change.label}</strong><span className={`geoConfidence geo-${change.confidence.toLowerCase()}`}>{change.confidence} säkerhet</span></div><p><b>{change.current30}</b> signaler senaste 30 d · {change.previous30} perioden före</p><small>{change.assessment}</small>{change.signalTypes.length>0&&<em>{change.signalTypes.slice(0,3).join(' · ')}</em>}{change.actors.length>0&&<em>Aktörer i underlaget: {change.actors.slice(0,3).join(', ')}</em>}</div>)}</div>}
   <div className='localSignalGrid'>{localSignals.map(({item,signal})=><a href={item.url} target='_blank' rel='noreferrer' key={item.url} onClick={()=>markSeen(item)}><div><b>{signal!.type}</b><em>{signal!.strength} signal</em></div><strong>{item.title}</strong><small>{item.source}{item.geographies.length?` · ${item.geographies.slice(0,2).join(', ')}`:''}</small><p>{signal!.reason}</p></a>)}</div></div>}
        {latestHeadlines.length>0&&<div className='latestHeadlines'><div className='latestHeadlinesTitle'><Landmark size={15}/><strong>Senaste från omvärlden</strong><span>de 8 senaste relevanta träffarna</span></div><div className='headlineRail'>{latestHeadlines.map(x=><a href={x.url} target='_blank' rel='noreferrer' key={x.url} onClick={()=>markSeen(x)}><time>{new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short'}).format(new Date(x.publishedAt))}</time><span>{x.title}</span><small>{x.source}</small><ExternalLink size={12}/></a>)}</div></div>}
  </section>}

  {data?.persistentIntelligence?.competitorBaselines?.length>0&&<section className='competitorEarlyWarning'>
    <div className='competitorEarlyWarningHead'><div><p className='eyebrow'><Radar size={14}/> KONKURRENT · TIDIG VARNING</p><h3>Vilka konkurrenter avviker från sin egen normalbild?</h3><p>Bevakly väger ihop aktivitetsnivå, nya geografier, nya teman och antal separata källor. Pressvolym ensam räcker inte.</p></div><span>{data.persistentIntelligence.competitorBaselines.length} att bevaka</span></div>
    <div className='competitorWarningGrid'>{data.persistentIntelligence.competitorBaselines.slice(0,6).map(c=><article className={`competitorWarningCard warning-${c.warningLevel.toLowerCase()}`} key={c.competitor}>
      <div className='competitorWarningTop'><h4>{c.competitor}</h4><div><b>{c.warningLevel}</b><span className={`geoConfidence geo-${c.confidence.toLowerCase()}`}>{c.confidence}</span></div></div>
      <p><strong>{c.current30}</strong> händelser senaste 30 d · normalt cirka {c.baselineMonthly.toFixed(1)} / 30 d{c.ratio!==null?` · ${c.ratio}×`:''}</p>
      <small>{c.assessment}</small>
      <div className='competitorWarningSignals'>{c.signals.slice(0,4).map(signal=><span key={signal}>{signal}</span>)}</div>
      {c.evidence.length>0&&<div className='historicalEvidence'>{c.evidence.slice(0,3).map(e=>e.eventUrl?<a href={e.eventUrl} target='_blank' rel='noreferrer' key={`${c.competitor}-${e.eventUrl}`}>{e.title}<ExternalLink size={11}/></a>:<span key={`${c.competitor}-${e.title}`}>{e.title}</span>)}</div>}
    </article>)}</div>
    <small className='storyClusterNote'>En tidig varning är en maskinell avvikelse från konkurrentens egen historik, inte ett påstående om avsikt. “Tydlig” kräver flera samtidiga förändringstecken och minst två separata källor.</small>
  </section>}

  {data?.persistentIntelligence?.historicalChanges?.length>0&&<section className='historicalChangePanel'>
    <div className='historicalChangeHead'><div><p className='eyebrow'><Database size={14}/> HISTORISK FÖRÄNDRING</p><h3>Vad avviker från de senaste sex månaderna?</h3><p>Bevakly jämför senaste 30 dagarna med de föregående fem månaderna och lyfter bara tydliga avvikelser i det sparade källunderlaget.</p></div><span>{data.persistentIntelligence.historicalChanges.length} avvikelser</span></div>
    <div className='historicalChangeGrid'>{data.persistentIntelligence.historicalChanges.slice(0,6).map(change=><article className='historicalChangeCard' key={change.id}>
      <div className='historicalChangeTop'><span>{change.dimension}</span><b className={`geoConfidence geo-${change.confidence.toLowerCase()}`}>{change.confidence}</b></div>
      <h4>{change.label}</h4>
      <strong>{change.status}</strong>
      <p><b>{change.current30}</b> senaste 30 d · normalt cirka {change.baselineMonthly.toFixed(1)} / 30 d{change.ratio!==null?` · ${change.ratio}× normal nivå`:''}</p>
      <small>{change.assessment}</small>
      {change.evidence.length>0&&<div className='historicalEvidence'>{change.evidence.slice(0,3).map(e=>e.eventUrl?<a href={e.eventUrl} target='_blank' rel='noreferrer' key={`${change.id}-${e.eventUrl}`}>{e.title}<ExternalLink size={11}/></a>:<span key={`${change.id}-${e.title}`}>{e.title}</span>)}</div>}
    </article>)}</div>
    <small className='storyClusterNote'>Historisk avvikelse betyder inte automatiskt strategisk förändring. Ny källtäckning, publiceringstakt och datamängd kan påverka resultatet. Evidensen ska alltid kunna öppnas.</small>
  </section>}

  {data&&storyClusters.length>0&&<section className='storyClusters'>
    <div className='storyClustersHead'><div><p className='eyebrow'><Sparkles size={14}/> VIKTIGAST JUST NU</p><h3>Flera träffar – en utveckling</h3><p>Bevakly slår ihop närliggande rapportering om samma sannolika händelse så att du slipper läsa samma sak flera gånger.</p></div><span>{storyClusters.length} sammanvägda utvecklingar</span></div>
    <div className='storyClusterGrid'>{storyClusters.map((cluster,i)=><article className='storyClusterCard' key={cluster.id}>
      <div className='storyClusterTop'><span>#{i+1} · {cluster.primary.category}</span><b>{cluster.score}/100</b></div>
      <h4>{cluster.primary.title}</h4>
      <p><strong>Sammanvägt:</strong> {cluster.storyCount} relevanta träffar · {cluster.independentSourceCount} oberoende källor.</p>
      <div className='storyClusterMeta'><span><ShieldCheck size={13}/>{cluster.label}</span>{cluster.geographies.slice(0,2).map(g=><span key={g}>{g}</span>)}</div>
      <div className='storyClusterSources'>{cluster.sources.slice(0,4).map(source=><span key={source}>{source}</span>)}</div>
      <a href={cluster.primary.url} target='_blank' rel='noreferrer'>Öppna huvudkällan <ExternalLink size={13}/></a>
    </article>)}</div>
    <small className='storyClusterNote'>Sammanslagningen är försiktig och bygger på kategori, tidsnärhet, geografi och gemensamma begrepp. Den betyder inte att källorna nödvändigtvis beskriver exakt samma händelse.</small>
  </section>}

  {data&&topicTimelines.length>0&&<section className='topicTimelines'>
    <div className='topicTimelinesHead'><div><p className='eyebrow'><Radar size={14}/> UTVECKLING ÖVER TID</p><h3>Från enstaka nyheter till en riktning</h3><p>Bevakly kopplar försiktigt ihop återkommande rapportering så att du kan följa hur ett strategiskt ämne utvecklas.</p></div><span>{topicTimelines.length} pågående utvecklingar</span></div>
    <div className='topicTimelineGrid'>{topicTimelines.map(t=><article className='topicTimelineCard' key={t.id}><div className='topicTimelineTop'><span>{t.category}</span><b className={`timelineDirection ${t.direction}`}>{t.direction}</b></div><h4>{t.label}</h4><p>{t.itemCount} relaterade händelser · {t.sourceCount} källor{t.geographies.length?` · ${t.geographies.slice(0,2).join(', ')}`:''}</p><div className='timelineRail'>{t.items.map((item,i)=><div className='timelinePoint' key={item.url}><span className='timelineDot'/><div><time>{date(item.publishedAt)}</time><a href={item.url} target='_blank' rel='noreferrer'>{item.title}</a><small>{item.source}</small></div></div>)}</div></article>)}</div>
    <small className='storyClusterNote'>Tidslinjen är en maskinell gruppering av sannolikt relaterade händelser. Den ska läsas som ett analysstöd, inte som bevis för att alla poster beskriver exakt samma projekt eller beslut.</small>
  </section>}

  {data&&brief&&<section className='morningBrief'>
    <div className='morningBriefHead'><div><p className='eyebrow'><Sunrise size={14}/> NYTT SEDAN SIST</p><h3>{brief.totalNew===0?'Du är ikapp':`${brief.totalNew} olästa relevanta händelser`}</h3><p>{visitWindow?.first?'Första besöket i denna branschprofil – visar senaste 24 timmarna.':`Sedan ${date(brief.since)}.`} {brief.totalNew>0?`De ${Math.min(5,brief.totalNew)} viktigaste olästa lyfts nedan.`:'Inga nya olästa händelser i tidsfönstret.'}</p></div><div className='briefCounters'><span><strong>{brief.protectedCount}</strong> skyddade signaler</span><span><strong>{brief.independentCount}</strong> fler-källestöd</span></div></div>
    {brief.totalNew>0&&<><div className='briefCategoryStrip'>{brief.categoryCounts.slice(0,5).map(c=><span key={c.category}>{c.category} <b>{c.count}</b></span>)}</div><div className='briefList'>{brief.top.map(({item,personalScore,protectedSignal},i)=><a className='briefItem' href={item.url} target='_blank' rel='noreferrer' key={item.url} onClick={()=>markSeen(item)}><span className='briefRank'>{i+1}</span><div><small>{item.category} · {item.source}</small><strong>{item.title}</strong><em>{item.evidence}{protectedSignal?' · skyddad signal':''}</em></div><span className='briefScore'>{personalScore}<ArrowRight size={14}/></span></a>)}</div></>}
  </section>}
  {data&&<>
   <div className='feedStats'><span><strong>{visiblePeriodCount}</strong> daterade händelser</span><span><ShieldCheck size={14}/>{data.sourceStatus.filter(x=>x.ok).length}/{data.sourceStatus.length} källor svarade</span><span><Globe2 size={14}/>{data.network.byScope.sweden??0} SE · {data.network.byScope.eu??0} EU · {data.network.byScope.international??0} intl.</span>{data.unknownDateExcluded>0&&<span>{data.unknownDateExcluded} odaterade utelämnade</span>}</div>
   <div className='personalRelevanceBar'><div><SlidersHorizontal size={16}/><div><strong>Personlig relevans</strong><small>{summary.total===0?'Markera nyheter så lär sig Bevakly vad du prioriterar.':`${summary.total} reaktioner · ${summary.follow} följs · modellen påverkar ordning, inte faktabedömning.`}</small></div></div><div className='rankingTabs'><button className={ranking==='personal'?'active':''} onClick={()=>setRanking('personal')}>För dig</button><button className={ranking==='latest'?'active':''} onClick={()=>setRanking('latest')}>Senaste</button>{summary.total>0&&<button className='resetPersonal' onClick={()=>setFeedback([])} title='Nollställ inlärning'><RotateCcw size={13}/>Nollställ</button>}</div></div>
   <div className='sourceNetworkBar'><div><Database size={16}/><div><strong>Källnät: {data.network.enabled} aktiva källor</strong><small>{data.network.tier1} primära/officiella · {data.network.tier2} bransch/forskning · {data.network.tier3} kompletterande</small></div></div><button onClick={()=>setShowSources(v=>!v)}>{showSources?'Dölj källor':'Visa källor'}</button></div>
   {showSources&&<><div className='sourceValueExplainer'><strong>Källinlärning</strong><span>Bevakly skiljer nu på värdet i den aktuella hämtningen och vad källan har bidragit med över flera körningar. Ingen källa tas bort automatiskt.</span></div><div className={`persistentHistoryStatus ${data.persistentIntelligence?.enabled&&!data.persistentIntelligence?.reason?'active':'fallback'}`}><Database size={14}/><div><strong>{data.persistentIntelligence?.enabled&&!data.persistentIntelligence?.reason?'Historiken sparas i Neon':'Lokal historik används'}</strong><small>{data.persistentIntelligence?.enabled&&!data.persistentIntelligence?.reason?`${data.persistentIntelligence.savedSourceRuns} källobservationer · ${data.persistentIntelligence.savedEventObservations} marknadshändelser sparades i denna körning.`:(data.persistentIntelligence?.reason||'Serverhistorik är inte tillgänglig ännu.')}</small></div></div><div className='sourceNetworkGrid'>{data.sourceStatus.map(s=>{const learned=sourceLearningMap.get(s.id);return <div className={`sourceNetworkItem ${s.ok?'ok':'bad'}`} key={s.id}><div><strong>{s.name}</strong><span>{scopeLabel(s.scope)} · nivå {s.tier} · {s.type}</span></div><small>{s.description||'Källa i vald branschprofil'}</small><div className='sourceValueRow'><b className={`sourceValueBadge value-${s.value.label==='Hög'?'high':s.value.label==='Medel'?'medium':'watch'}`}>Nu {s.value.score}/100 · {s.value.label}</b><em>{s.ok?`${s.hits} kandidater`:`Svarade inte${s.error?`: ${s.error}`:''}`}</em></div>{learned&&<div className='sourceLearningRow'><b>{learned.label} · {learned.score}/100</b><span>{learned.runs} historiska körningar · trend {learned.trend}</span><small>{learned.reasons.slice(0,3).join(' · ')}</small></div>}<p className='sourceValueReasons'>{s.value.reasons.slice(0,3).join(' · ')}</p></div>})}</div><small className='sourceValueLimitation'>{sourceLearning[0]?.limitation??data.sourceStatus[0]?.value?.limitation}</small></>}
   {data.authorityDiscoveryCoverage&&data.industry.id==='waste'&&<section className='authorityCoverage'>
     <div><Radar size={15}/><div><strong>Aktiv discovery-yta</strong><small>Bevakly har nu en sökplan för {data.authorityDiscoveryCoverage.municipalityTargets} kommuner och {data.authorityDiscoveryCoverage.countyTargets} länsstyrelseområden.</small></div></div>
     <span>{data.authorityDiscoveryCoverage.activeTargets} mål har redan en direkt bevakad källa · {data.authorityDiscoveryCoverage.uncoveredTargets} återstår att koppla till aktiv hämtning</span>{data.discoveryPipeline&&<small className='authorityBatch'>Resultatpipeline: {data.discoveryPipeline.ready?'redo':'ej redo'} · provider {data.discoveryPipeline.providerConnected?'ansluten':'inte ansluten'} · canonicalisering, kvalitetsfilter, Early Signal, entiteter, deduplicering och evidens är förberedda.</small>}{data.discoveryProvider&&<small className='authorityBatch'>Providerlager: cache {data.discoveryProvider.cacheTtlHours} h · max {data.discoveryProvider.maxQueriesPerRun} sökningar/körning · retry {data.discoveryProvider.retryCount} · failover {data.discoveryProvider.failoverReady?'redo':'ej redo'} · {data.discoveryProvider.providerAdapters.filter(x=>x.configured).length}/{data.discoveryProvider.providerAdapters.length} providers konfigurerade.</small>}
     {data.authorityDiscoveryBatch&&<small className='authorityBatch'>Dagens batch: {data.authorityDiscoveryBatch.jobs.length} mål · {data.authorityDiscoveryBatch.representedCounties} län representerade · {data.authorityDiscoveryBatch.directSourceJobs} direktkopplade · {data.authorityDiscoveryBatch.searchRequiredJobs} kräver sökadapter</small>}
   </section>}
   {data.discoveryResults?.length>0&&<section className='discoveryFeed'><div className='discoveryFeedHead'><div><Radar size={16}/><div><strong>Upptäckt utanför det fasta källnätet</strong><small>Bevakly följer relevanta externa länkar och prioriterar försignaler som tillstånd, samråd, mark/bygglov, kapacitet, rekrytering och etablering. Källorna är ännu inte permanent godkända.</small></div></div><span>{data.discoveryResults.length} nya träffar</span></div><div className='discoveryFeedGrid'>{data.discoveryResults.map(x=><article className={`discoveryFeedCard ${x.earlySignal?'earlyDiscovery':''}`} key={x.url}><div><span>{x.earlySignal?`TIDIG SIGNAL · ${x.earlySignal.type}`:`DISCOVERY · ${x.category}`}</span><b>{x.score}/100</b></div><h4>{x.title}</h4><p>{x.factualSummary}</p>{x.earlySignal&&<div className='earlyDiscoveryBox'><strong>{x.earlySignal.strength} försignal</strong><p>{x.earlySignal.reason}</p><small><b>Bevaka nästa:</b> {x.earlySignal.watchNext}</small></div>}<small>{x.source} · {date(x.publishedAt)} · {x.confidence} källförtroende</small>{x.keywordHits.length>0&&<div className='newsTags'>{x.keywordHits.slice(0,4).map(k=><span key={k}>{k}</span>)}</div>}<a href={x.url} target='_blank' rel='noreferrer'>Öppna upptäckt källa <ExternalLink size={12}/></a></article>)}</div><small className='storyClusterNote'>Discovery-träffar analyseras men påverkar inte automatiskt permanent källstatus. Återkommande värdefulla domäner kan senare föreslås till källnätet.</small></section>}
   {data.sourceSuggestions.length>0&&<div className='sourceDiscovery'><div className='sourceDiscoveryHead'><div><Radar size={16}/><div><strong>{data.sourceSuggestions.length} nya källkandidater upptäckta</strong><small>Bevakly föreslår — ingen källa läggs till automatiskt.</small></div></div><button onClick={()=>setShowSuggestions(v=>!v)}>{showSuggestions?'Dölj förslag':'Granska förslag'}</button></div>{showSuggestions&&<div className='sourceSuggestionGrid'>{data.sourceSuggestions.map(s=><article className='sourceSuggestionCard' key={s.domain}><div className='suggestionTop'><span><Sparkles size={13}/> KÄLLFÖRSLAG</span><b>{s.score}/100 · {s.confidence} säkerhet</b></div><h4>{s.domain}</h4><p>{s.reasons.join(' · ')}</p><div className='suggestionMeta'><span>{s.occurrences} relevanta länkar</span><span>Via {s.discoveredFrom.slice(0,3).join(', ')}</span></div>{s.matchedKeywords.length>0&&<div className='newsTags'>{s.matchedKeywords.slice(0,5).map(k=><span key={k}>{k}</span>)}</div>}<div className='suggestionSamples'>{s.sampleLinks.slice(0,2).map(l=><a key={l.url} href={l.url} target='_blank' rel='noreferrer'>{l.title}<ExternalLink size={12}/></a>)}</div><a className='homepageLink' href={s.homepage} target='_blank' rel='noreferrer'>Granska domänen <ExternalLink size={12}/></a></article>)}</div>}</div>}
   <p className='feedIntegrity'>{data.note} Personlig ranking används endast för ordningen och får inte undertrycka skyddade signaler med hög grundrelevans, starkt källstöd eller officiellt regelverk.</p>
   <div className='dailyFlowBar'><div><Eye size={15}/><span><strong>{visibleRanked.length}</strong> olästa i vyn</span></div><div><button className={showRead?'active':''} onClick={()=>setShowRead(v=>!v)}>{showRead?'Dölj lästa':'Visa lästa'}</button>{ranked.length>0&&<button onClick={markVisibleSeen}><CheckCircle2 size={13}/>Markera vyn som läst</button>}</div></div>
   <div className='feedCategoryTabs'>{categories.map(c=><button className={category===c?'active':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className='newsList'>{visibleRanked.length?visibleRanked.map(({item:x,personal,focus})=>{const selected=currentFeedback(x);const impact=explainImpact({category:x.category,score:x.score,evidence:x.evidence,independentSourceCount:x.independentSourceCount,geographies:x.geographies});const novelty=detectNovelty(x,profileItems.map(y=>y.item));return <article className={`newsCard ${selected==='follow'?'followedNews':''} ${isSeen(x)?'readNews':''}`} key={x.url}><div className='newsTop'><span className='newsCategory'>{x.category}</span><span className='newsScore'>{ranking==='personal'&&summary.total>0?<>{personal.score}/100 för dig <em className={personal.adjustment>0?'positiveAdjustment':personal.adjustment<0?'negativeAdjustment':''}>{personal.adjustment>0?`+${personal.adjustment}`:personal.adjustment||''}</em></>:<>{x.score}/100 · {x.importance}</>}</span></div><h3>{x.title}</h3><div className='newsMeta'><span><CalendarDays size={13}/>{date(x.publishedAt)}</span><span>{x.source}</span><span>{scopeLabel(x.sourceScope)}</span></div><div className='evidenceLine'><ShieldCheck size={14}/><strong>{x.evidence}</strong>{x.independentSourceCount>1&&<span>{x.independentSourceCount} oberoende ursprung</span>}{x.distinctDomainCount>x.independentSourceCount&&<span>{x.distinctDomainCount} domäner totalt</span>}{personal.protectedSignal&&<span className='protectedSignal'>skyddad signal</span>}</div>{x.evidenceQuality&&x.evidenceQuality.reasons.length>0&&<div className='evidenceProvenance'><strong>Beviskedja</strong><span>{x.evidenceQuality.reasons.slice(0,3).join(' · ')}</span>{x.evidenceQuality.republisherCount>0&&<small>Bevakly sänker inte beviskraven bara för att samma ursprung har återpublicerats på flera sajter.</small>}</div>}{classifyLocalSignal(x)&&<div className='localSignalChip'><Radar size={13}/><strong>{classifyLocalSignal(x)!.type}</strong><span>{classifyLocalSignal(x)!.strength} lokal signal</span></div>}<p><strong>Fakta från källan:</strong> {x.factualSummary}</p><div className='whyMattersBox'><p><strong>Varför är detta viktigt?</strong> {impact.whyItMatters}</p><p><strong>Bevaka härnäst:</strong> {impact.watchNext}</p><small>{impact.evidenceNote}</small></div><div className={`noveltyBox ${novelty.status}`}><div className='noveltyTop'><strong>Vad är faktiskt nytt?</strong><span>{novelty.label}</span></div><p>{novelty.summary}</p>{novelty.newDetails.length>0&&<div className='noveltyDetails'>{novelty.newDetails.map(d=><span key={d}>{d}</span>)}</div>}{novelty.comparedWith>0&&<small>Jämfört med {novelty.comparedWith} liknande äldre händelse{novelty.comparedWith===1?'':'r'} i de senaste 30 dagarna.</small>}</div>{(focus.reasons.length>0||ranking==='personal'&&summary.total>0&&personal.reasons.length>0)&&<p className='personalReason'><strong>Varför denna placering:</strong> {[...focus.reasons,...personal.reasons].slice(0,3).join(' · ')}</p>}{x.confirmingSources.length>1&&<p className='confirmingSources'>Liknande träffar: {x.confirmingSources.slice(0,4).join(' · ')}</p>}{x.geographies.length>0&&<div className='newsTags'>{x.geographies.slice(0,3).map(g=><span key={g}>{g}</span>)}</div>}<div className='newsActions'><div className='feedbackButtons'><button className={isSeen(x)?'selected':''} onClick={()=>markSeen(x)} disabled={isSeen(x)} title='Markera som läst'><CheckCircle2 size={13}/>{isSeen(x)?'Läst':'Markera läst'}</button><button className={selected==='important'?'selected':''} onClick={()=>react(x,'important')} title='Prioritera liknande innehåll'><ThumbsUp size={13}/>{feedbackLabel('important')}</button><button className={selected==='irrelevant'?'selected irrelevant':''} onClick={()=>react(x,'irrelevant')} title='Nedprioritera liknande innehåll'><ThumbsDown size={13}/>{feedbackLabel('irrelevant')}</button><button className={selected==='follow'?'selected follow':''} onClick={()=>react(x,'follow')} title='Följ detta ämne extra noga'><Bookmark size={13}/>{feedbackLabel('follow')}</button></div><a href={x.url} target='_blank' rel='noreferrer' onClick={()=>markSeen(x)}>Öppna originalkälla <ExternalLink size={13}/></a></div></article>}):!loading&&<p className='emptyState'>{ranked.length>0?'Du är ikapp – alla händelser i vyn är lästa. Välj “Visa lästa” om du vill gå tillbaka.':'Inga daterade relevanta händelser hittades för filtret.'}</p>}</div>
  </>}
 </section>;
}
