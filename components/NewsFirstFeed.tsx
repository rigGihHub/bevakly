'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { canonicalizeCompetitorName } from '@/lib/intelligence/entities';
import { selectProfileNews } from '@/lib/intelligence/profile-news-selection';
import { competitorCoverageStatus, type CompetitorSourceCheck } from '@/lib/intelligence/competitor-coverage-status';
import type { WatchProfile } from '@/lib/intelligence/watch-profiles';
import { buildNewsCardAnalysis, type CardBidRelevance } from '@/lib/intelligence/news-card-analysis';
import { fetchFeedShared, readFeedSnapshot } from '@/lib/client/feed-cache';
import { assessRefreshPerformance } from '@/lib/intelligence/refresh-performance';
import type { RefreshPerformance } from '@/lib/intelligence/refresh-performance';
import type { RefreshHistorySummary } from '@/lib/intelligence/refresh-history';
import { initializeNewsSeenSnapshot, markNewsSeen, normalizeNewsKey, parseNewsSeenSnapshot, unseenNewsKeys, type NewsSeenSnapshot } from '@/lib/intelligence/news-seen-state';

type NewsItem={
  title:string;url:string;source:string;publishedAt:string;category?:string;importance?:string;factualSummary?:string;
  competitors?:string[];geographies?:string[];score?:number;status?:string;sourceType?:string;sourceCount?:number;
  independentSourceCount?:number;evidence?:string;bidNewsRelevance?:CardBidRelevance|null;
  evidenceStatus?:'self-reported'|'independently-reported'|'officially-confirmed'|'multi-source-confirmed'|'single-source';
  evidenceLabel?:string;sourceScope?:string;profileReasons?:string[];profileBonus?:number;
};
type IntakeDiagnostics={fixed?:{rawCandidates?:number;clustersConsidered?:number;articleReadAttempted?:number;articleReadFailed?:number;missingOrInvalidDate?:number;outsideSelectedPeriod?:number;acceptedInPeriod?:number};discovery?:{processedResults?:number;accepted?:number;rejected?:number;dedupeDropped?:number;rejectionReasons?:Record<string,number>}};
type SourceStatus=CompetitorSourceCheck&{type:string;hits:number;runHealth?:string};
type RefreshRuntime={mode?:'full'|'special';elapsedMs?:number;totalBudgetMs?:number;phaseMs?:{sources?:number;articles?:number;discovery?:number};performance?:RefreshPerformance;history?:{mode:'database'|'unavailable';saved:boolean;summary:RefreshHistorySummary;reason:string|null}};
type Payload={profileSelection?:{filteredOut:number};fetchedAt?:string;items?:NewsItem[];newsFeedItems?:NewsItem[];discoveryResults?:NewsItem[];newsIntakeDiagnostics?:IntakeDiagnostics;sourceStatus?:SourceStatus[];newsIntake?:{refreshRuntime?:RefreshRuntime};note?:string};

function fmtDate(value:string){try{return new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return value}}
function keyOf(item:NewsItem){return normalizeNewsKey(item.url)}
function sortForView(items:NewsItem[],unseen:Set<string>){
  return [...items].sort((a,b)=>{
    const aNew=unseen.has(keyOf(a))?1:0;
    const bNew=unseen.has(keyOf(b))?1:0;
    if(aNew!==bNew)return bNew-aNew;
    const scoreDelta=(b.score??0)+(b.profileBonus??0)-(a.score??0)-(a.profileBonus??0);
    if(Math.abs(scoreDelta)>=8)return scoreDelta;
    return new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()||scoreDelta;
  });
}

type FeedFocus='industry'|'competitors'|'ai-tools'|'google-workspace';

export default function NewsFirstFeed({industry,customIndustry,profile,focus,days=7}:{industry:string;customIndustry?:string;profile:WatchProfile;focus:FeedFocus;days?:7|30}){
  const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const requestId=useRef(0);
  const [startedAt,setStartedAt]=useState<number|null>(null),[elapsedSeconds,setElapsedSeconds]=useState(0),[visibleCount,setVisibleCount]=useState(12);
  const profileKey=JSON.stringify([profile.id,profile.updatedAt,profile.market,profile.regions,profile.themes,profile.actors]);
  const [seenSnapshot,setSeenSnapshot]=useState<NewsSeenSnapshot|null>(null);
  const [seenStateLoaded,setSeenStateLoaded]=useState(false);
  const seenStorageKey=`bevakly:seen-news:v1:${profile.id}`;

  const persistSeen=(snapshot:NewsSeenSnapshot)=>{
    setSeenSnapshot(snapshot);
    try{localStorage.setItem(seenStorageKey,JSON.stringify(snapshot))}catch{}
  };

  const load=async()=>{
    const id=++requestId.current;setLoading(true);setError(null);setStartedAt(Date.now());setElapsedSeconds(0);
    try{
      const qs=new URLSearchParams({industry,days:String(days),refresh:Date.now().toString()});
      if(customIndustry)qs.set('custom',customIndustry);
      if(profile.actors.length)qs.set('actors',profile.actors.join('|'));
      qs.set('market',profile.market);qs.set('regions',profile.regions.join('|'));qs.set('themes',profile.themes.join('|'));
      const url=`/api/industry-feed?${qs}`;
      const snapshot=readFeedSnapshot<Payload>(url);
      if(snapshot)setData(snapshot);
      const payload=await fetchFeedShared<Payload>(url);
      if(id!==requestId.current)return;
      setData(payload);
      window.dispatchEvent(new CustomEvent('bevakly:refresh-done',{detail:{fetchedAt:payload.fetchedAt}}));
    }catch(e){if(id!==requestId.current)return;setError(e instanceof Error?e.message:'Kunde inte hämta nyheter');window.dispatchEvent(new CustomEvent('bevakly:refresh-error'))}
    finally{if(id===requestId.current){setLoading(false);setStartedAt(null)}}
  };

  useEffect(()=>{
    let snapshot:NewsSeenSnapshot|null=null;
    try{snapshot=parseNewsSeenSnapshot(localStorage.getItem(seenStorageKey))}catch{}
    setSeenSnapshot(snapshot);setSeenStateLoaded(true);
  },[seenStorageKey]);
  useEffect(()=>{setData(null);void load();return()=>{requestId.current++}},[industry,customIndustry,profileKey,days]);
  useEffect(()=>{setVisibleCount(12)},[focus,profileKey]);
  useEffect(()=>{if(!startedAt)return;const timer=window.setInterval(()=>setElapsedSeconds(Math.floor((Date.now()-startedAt)/1000)),1000);return()=>clearInterval(timer)},[startedAt]);
  useEffect(()=>{const h=()=>void load();window.addEventListener('bevakly:refresh-all',h);return()=>window.removeEventListener('bevakly:refresh-all',h)},[industry,customIndustry,profileKey,days]);

  const all=useMemo(()=>{
    const m=new Map<string,NewsItem>();
    const candidates=data?.newsFeedItems??[...(data?.items??[]),...(data?.discoveryResults??[])];
    for(const item of candidates){if(item?.url&&!m.has(keyOf(item)))m.set(keyOf(item),item)}
    const unique=[...m.values()];
    const selected=focus==='ai-tools'||focus==='google-workspace'?unique:selectProfileNews(unique,profile);
    return selected.sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime());
  },[data,profileKey,focus]);

  useEffect(()=>{
    if(!seenStateLoaded||seenSnapshot||loading||!data)return;
    persistSeen(initializeNewsSeenSnapshot(all.map(keyOf),data.fetchedAt??new Date().toISOString()));
  },[seenStateLoaded,seenSnapshot,loading,data,all.length]);

  const competitor=all.filter(x=>(x.competitors??[]).some(c=>profile.actors.some(a=>canonicalizeCompetitorName(a).toLocaleLowerCase('sv-SE')===canonicalizeCompetitorName(c).toLocaleLowerCase('sv-SE'))));
  const industryNews=all.filter(x=>!competitor.includes(x));
  const unseen=useMemo(()=>unseenNewsKeys(seenSnapshot,all.map(keyOf)),[seenSnapshot,all]);
  const isSpecial=focus==='ai-tools'||focus==='google-workspace';
  const label=focus==='competitors'?'Konkurrenter':focus==='ai-tools'?'AI-verktyg':focus==='google-workspace'?'Google Workspace':'Branschen';
  const baseItems=isSpecial?all:focus==='competitors'?competitor:industryNews;
  const items=useMemo(()=>sortForView(baseItems,unseen),[baseItems,unseen]);
  const unreadInView=items.filter(item=>unseen.has(keyOf(item))).length;
  const coverage=profile.actors.map(actor=>competitorCoverageStatus(actor,data?.sourceStatus??[],all,data?.fetchedAt));
  const runtime=data?.newsIntake?.refreshRuntime;
  const phaseEntries=runtime?.phaseMs?Object.entries(runtime.phaseMs).filter((x):x is [string,number]=>typeof x[1]==='number'):[];
  const performance=runtime?.performance??(runtime?.phaseMs?assessRefreshPerformance(runtime.phaseMs,runtime.totalBudgetMs,runtime.elapsedMs):null);
  const stageLabel=(stage:string)=>stage==='sources'?'Källor':stage==='articles'?'Artiklar':stage==='discovery'?'Extern sökning':'Övrig bearbetning';
  const runtimeStage=performance&&performance.otherMs>performance.slowestMs?'other':performance?.slowest;
  const runtimeLabel=runtimeStage?stageLabel(runtimeStage):null;
  const history=runtime?.history?.mode==='database'?runtime.history.summary:null;

  const markSeen=(keys:string[])=>{
    if(!seenSnapshot)return;
    persistSeen(markNewsSeen(seenSnapshot,keys));
  };

  return <section id="industry-feed" className="newsFirstFeed" aria-busy={loading}>
    {loading&&<div role="status" aria-live="polite" className="feedLoading"><strong>{data?'Uppdaterar nyheterna…':'Hämtar nyheter för din bevakning…'}</strong><span>{elapsedSeconds} s · {elapsedSeconds>=45?'Hämtningen tar längre tid än normalt.':data?'Tidigare resultat visas under hämtningen.':'Källor och artiklar kontrolleras innan resultat visas.'}</span>{data?.fetchedAt&&<small>Visar sparat resultat från {fmtDate(data.fetchedAt)}.</small>}<small>Upp till cirka 45 sekunder är normalt för en full kontroll. Du kan byta mellan Branschen och Konkurrenterna under tiden.</small></div>}
    {error&&<div role="alert" className="feedError"><strong>Hämtningen misslyckades.</strong> {error}{data&&<p>Tidigare resultat visas. De har inte uppdaterats.</p>}<button className="linkButton" onClick={()=>void load()}>Försök igen</button></div>}
    {focus==='competitors'&&data&&<details className="competitorCoverage" open={items.length===0}><summary>Källstatus för dina {profile.actors.length} konkurrenter</summary><p>Avser direktkällor i senaste hämtningen. En nådd källsida innebär inte att alla nyheter har kontrollerats.</p><ul>{coverage.map(c=><li key={c.actor}><strong>{c.actor}</strong><span>{c.hits} relevanta träffar · {c.label}</span><small>{c.lastSuccessfulCheck?`Källsida senast nådd ${fmtDate(c.lastSuccessfulCheck)}`:'Ingen lyckad direktkontroll i denna hämtning'}</small>{c.sources.map(source=><small key={source.id}>{source.name}: {source.ok?'Källsida nådd':'Kunde inte nås'}{source.articleChecks?` · ${source.articleChecks} artikelförsök`:''}{source.articleFailures?` · ${source.articleFailures} läsfel`:''}</small>)}</li>)}</ul></details>}

    <section id={focus==='competitors'?'actors':undefined} className="newsFeedPanel">
      <div className="newsFeedHeader">
        <div className="newsFeedTitle"><h3>{label}</h3><strong>{loading&&!data?"…":items.length}</strong>{unreadInView>0&&<span title="Inte tidigare markerad som läst i denna webbläsare" style={{fontSize:11,fontWeight:800,padding:'2px 6px',borderRadius:999,background:'#eef6ee'}}>+{unreadInView} nya</span>}</div>
        {unreadInView>0&&<button onClick={()=>markSeen(items.filter(item=>unseen.has(keyOf(item))).map(keyOf))} style={{border:0,background:'transparent',fontSize:11,fontWeight:700,cursor:'pointer',padding:4}}>Markera lästa</button>}
      </div>
      {loading&&!data&&<div className="feedSkeleton" aria-hidden="true">{[0,1,2].map(n=><div key={n}><span/><span/><span/></div>)}</div>}
      {!loading&&!error&&items.length===0&&<p className="feedEmpty">{focus==='competitors'?(profile.actors.length?'Inga godkända nyheter för dina konkurrenter hittades i denna hämtning. Se källstatus ovan.':'Välj konkurrenter i din bevakning för att använda detta spår.'):`Inga nyheter matchar din bevakning under de senaste ${days} dagarna.`}</p>}
      {!!data?.profileSelection?.filteredOut&&<p className="feedScopeNote">{data.profileSelection.filteredOut} träffar utanför profilens marknad, områden eller teman har filtrerats bort.</p>}
      {items.length>0&&<div className="newsFeedList">{items.slice(0,visibleCount).map(item=>{
        const analysis=buildNewsCardAnalysis({...item,watchKind:isSpecial?focus:undefined});
        const itemKey=keyOf(item);
        const isNew=unseen.has(itemKey);
        return <article key={itemKey} className="newsFeedCard">
          <div className="newsFeedMeta">{isNew&&<span title="Inte tidigare markerad som läst i denna webbläsare" style={{fontWeight:900,color:'#1f6b3b'}}>NY</span>}<span>{fmtDate(item.publishedAt)}</span><span>· {item.source}</span>{item.category&&<span>· {item.category}</span>}{item.evidenceLabel&&<span style={{fontWeight:800,color:item.evidenceStatus==='self-reported'?'#7a5a20':'#1f6b3b'}}>· {item.evidenceLabel}</span>}{analysis.label&&analysis.level!=='insufficient'&&<span>· {analysis.label}</span>}</div>
          <h4 className="newsFeedHeadline">{item.title}</h4>
          {item.factualSummary&&<p style={{margin:'0 0 6px',fontSize:13,lineHeight:1.4}}>{item.factualSummary}</p>}
          {!!item.profileReasons?.length&&<p className="newsProfileReason">{item.profileReasons.join(" · ")}</p>}
          <div className="newsFeedMeaning">
            <div><strong>{analysis.level==='insufficient'?'Analysunderlag:':'Möjlig betydelse:'}</strong> {analysis.why}</div>
            {analysis.watchFor&&<div style={{marginTop:3}}><strong>Håll koll på:</strong> {analysis.watchFor}</div>}
            {!item.evidenceLabel&&analysis.evidenceNote&&<div style={{marginTop:3,fontSize:12,color:'var(--muted,#5f6b66)'}}>{analysis.evidenceNote}</div>}
          </div>
          <a className="newsFeedOriginal" href={item.url} target="_blank" rel="noreferrer" onClick={()=>markSeen([itemKey])}>Original <ExternalLink size={12}/></a>
        </article>;
      })}</div>}
      {items.length>visibleCount&&<button className="linkButton" onClick={()=>setVisibleCount(n=>n+12)}>Visa fler ({items.length-visibleCount} kvar)</button>}
    </section>
    {runtime&&<details className="feedRuntime"><summary><span>Uppdatering {Math.round((runtime.elapsedMs??0)/1000)} s</span>{runtimeLabel&&<small>Långsammast: {runtimeLabel} {Math.round(((runtimeStage==='other'?performance?.otherMs:performance?.slowestMs)??0)/1000)} s · {performance?.status==='slow'?'Långsam':performance?.status==='watch'?'Bevaka':'Bra'}</small>}</summary><div>{phaseEntries.map(([name,ms])=><span key={name}>{stageLabel(name)} <b>{(ms/1000).toFixed(1)} s</b></span>)}{performance&&<span>Övrig bearbetning <b>{(performance.otherMs/1000).toFixed(1)} s</b></span>}</div><p className="feedRuntimeHistory">{history?.runs?<>Senaste {history.runs} körningarna för samma bevakning · Median {((history.medianElapsedMs??0)/1000).toFixed(1)} s · 90:e percentil {((history.p90ElapsedMs??0)/1000).toFixed(1)} s.{history.status==='collecting'?` Samlar underlag (${history.runs}/${history.minimumRuns}).`:history.bottleneck?` Återkommande flaskhals: ${stageLabel(history.bottleneck)} (${history.bottleneckRuns}/${history.runs}).`:' Ingen återkommande flaskhals.'}</>:'Historik saknas för uppdateringstider.'}</p></details>}

  </section>
}
