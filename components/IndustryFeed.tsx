'use client';
import { useEffect,useMemo,useState } from 'react';
import { Bookmark, CalendarDays, ExternalLink, Filter, Globe2, Newspaper, RefreshCw, ShieldCheck, Database, Radar, Sparkles, ThumbsDown, ThumbsUp, RotateCcw, SlidersHorizontal, Sunrise, ArrowRight, CheckCircle2, Eye } from 'lucide-react';
import { buildFeedback, feedbackSummary, personalScore, stableItemKey, type FeedbackKind, type FeedbackRecord } from '@/lib/intelligence/personal-relevance';
import { buildMorningBrief } from '@/lib/intelligence/morning-brief';
import { profileMatch, type WatchProfile } from '@/lib/intelligence/watch-profiles';
import { explainImpact } from '@/lib/intelligence/impact-explanation';
import { buildStoryClusters } from '@/lib/intelligence/story-clusters';
import { detectNovelty } from '@/lib/intelligence/novelty';
import { buildTopicTimelines } from '@/lib/intelligence/topic-timelines';

type Item={title:string;url:string;source:string;sourceType:string;sourceScope:string;sourceTier:number;sourceCount:number;independentSourceCount:number;confirmingSources:string[];evidence:string;publishedAt:string;category:string;score:number;importance:string;factualSummary:string;geographies:string[];articleReadOk:boolean};
type SourceStatus={id:string;name:string;type:string;scope:string;tier:number;description:string;ok:boolean;hits:number;error?:string};
type SourceSuggestion={domain:string;homepage:string;score:number;confidence:'hög'|'medel'|'låg';occurrences:number;discoveredFrom:string[];matchedKeywords:string[];sampleLinks:{title:string;url:string}[];reasons:string[];status:'föreslagen'};
type Payload={industry:{id:string;label:string;description:string};days:number;totalCandidates:number;totalInPeriod:number;unknownDateExcluded:number;network:{enabled:number;tier1:number;tier2:number;tier3:number;byScope:Record<string,number>};sourceStatus:SourceStatus[];sourceSuggestions:SourceSuggestion[];items:Item[];note:string};
const periods=[{d:1,l:'24 timmar'},{d:3,l:'3 dagar'},{d:7,l:'7 dagar'},{d:30,l:'30 dagar'}];
const storageKey=(profileId:string)=>`bevakly:relevance:v2:${profileId}`;
const visitKey=(profileId:string)=>`bevakly:last-visit:v2:${profileId}`;
const visitSessionKey=(profileId:string)=>`bevakly:visit-session:v2:${profileId}`;
const seenKey=(profileId:string)=>`bevakly:seen:v1:${profileId}`;
function date(v:string){return new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
function scopeLabel(scope:string){return scope==='sweden'?'Sverige':scope==='eu'?'EU':scope==='nordic'?'Norden':'Internationellt';}
function feedbackLabel(kind:FeedbackKind){return kind==='important'?'Viktigt':kind==='irrelevant'?'Ointressant':'Följ detta';}
export default function IndustryFeed({industry,customIndustry,profile}:{industry:string;customIndustry?:string;profile:WatchProfile}){
 const [days,setDays]=useState(7),[category,setCategory]=useState('Alla'),[data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[showSources,setShowSources]=useState(false),[showSuggestions,setShowSuggestions]=useState(false),[ranking,setRanking]=useState<'personal'|'latest'>('personal'),[feedback,setFeedback]=useState<FeedbackRecord[]>([]),[feedbackReady,setFeedbackReady]=useState(false),[visitWindow,setVisitWindow]=useState<{since:string;until:string;first:boolean}|null>(null),[seen,setSeen]=useState<string[]>([]),[showRead,setShowRead]=useState(false);
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
   {showSources&&<div className='sourceNetworkGrid'>{data.sourceStatus.map(s=><div className={`sourceNetworkItem ${s.ok?'ok':'bad'}`} key={s.id}><div><strong>{s.name}</strong><span>{scopeLabel(s.scope)} · nivå {s.tier} · {s.type}</span></div><small>{s.description||'Källa i vald branschprofil'}</small><em>{s.ok?`${s.hits} kandidater`:`Svarade inte${s.error?`: ${s.error}`:''}`}</em></div>)}</div>}
   {data.sourceSuggestions.length>0&&<div className='sourceDiscovery'><div className='sourceDiscoveryHead'><div><Radar size={16}/><div><strong>{data.sourceSuggestions.length} nya källkandidater upptäckta</strong><small>Bevakly föreslår — ingen källa läggs till automatiskt.</small></div></div><button onClick={()=>setShowSuggestions(v=>!v)}>{showSuggestions?'Dölj förslag':'Granska förslag'}</button></div>{showSuggestions&&<div className='sourceSuggestionGrid'>{data.sourceSuggestions.map(s=><article className='sourceSuggestionCard' key={s.domain}><div className='suggestionTop'><span><Sparkles size={13}/> KÄLLFÖRSLAG</span><b>{s.score}/100 · {s.confidence} säkerhet</b></div><h4>{s.domain}</h4><p>{s.reasons.join(' · ')}</p><div className='suggestionMeta'><span>{s.occurrences} relevanta länkar</span><span>Via {s.discoveredFrom.slice(0,3).join(', ')}</span></div>{s.matchedKeywords.length>0&&<div className='newsTags'>{s.matchedKeywords.slice(0,5).map(k=><span key={k}>{k}</span>)}</div>}<div className='suggestionSamples'>{s.sampleLinks.slice(0,2).map(l=><a key={l.url} href={l.url} target='_blank' rel='noreferrer'>{l.title}<ExternalLink size={12}/></a>)}</div><a className='homepageLink' href={s.homepage} target='_blank' rel='noreferrer'>Granska domänen <ExternalLink size={12}/></a></article>)}</div>}</div>}
   <p className='feedIntegrity'>{data.note} Personlig ranking används endast för ordningen och får inte undertrycka skyddade signaler med hög grundrelevans, starkt källstöd eller officiellt regelverk.</p>
   <div className='dailyFlowBar'><div><Eye size={15}/><span><strong>{visibleRanked.length}</strong> olästa i vyn</span></div><div><button className={showRead?'active':''} onClick={()=>setShowRead(v=>!v)}>{showRead?'Dölj lästa':'Visa lästa'}</button>{ranked.length>0&&<button onClick={markVisibleSeen}><CheckCircle2 size={13}/>Markera vyn som läst</button>}</div></div>
   <div className='feedCategoryTabs'>{categories.map(c=><button className={category===c?'active':''} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className='newsList'>{visibleRanked.length?visibleRanked.map(({item:x,personal,focus})=>{const selected=currentFeedback(x);const impact=explainImpact({category:x.category,score:x.score,evidence:x.evidence,independentSourceCount:x.independentSourceCount,geographies:x.geographies});const novelty=detectNovelty(x,profileItems.map(y=>y.item));return <article className={`newsCard ${selected==='follow'?'followedNews':''} ${isSeen(x)?'readNews':''}`} key={x.url}><div className='newsTop'><span className='newsCategory'>{x.category}</span><span className='newsScore'>{ranking==='personal'&&summary.total>0?<>{personal.score}/100 för dig <em className={personal.adjustment>0?'positiveAdjustment':personal.adjustment<0?'negativeAdjustment':''}>{personal.adjustment>0?`+${personal.adjustment}`:personal.adjustment||''}</em></>:<>{x.score}/100 · {x.importance}</>}</span></div><h3>{x.title}</h3><div className='newsMeta'><span><CalendarDays size={13}/>{date(x.publishedAt)}</span><span>{x.source}</span><span>{scopeLabel(x.sourceScope)}</span></div><div className='evidenceLine'><ShieldCheck size={14}/><strong>{x.evidence}</strong>{x.independentSourceCount>1&&<span>{x.independentSourceCount} oberoende domäner</span>}{personal.protectedSignal&&<span className='protectedSignal'>skyddad signal</span>}</div><p><strong>Fakta från källan:</strong> {x.factualSummary}</p><div className='whyMattersBox'><p><strong>Varför är detta viktigt?</strong> {impact.whyItMatters}</p><p><strong>Bevaka härnäst:</strong> {impact.watchNext}</p><small>{impact.evidenceNote}</small></div><div className={`noveltyBox ${novelty.status}`}><div className='noveltyTop'><strong>Vad är faktiskt nytt?</strong><span>{novelty.label}</span></div><p>{novelty.summary}</p>{novelty.newDetails.length>0&&<div className='noveltyDetails'>{novelty.newDetails.map(d=><span key={d}>{d}</span>)}</div>}{novelty.comparedWith>0&&<small>Jämfört med {novelty.comparedWith} liknande äldre händelse{novelty.comparedWith===1?'':'r'} i de senaste 30 dagarna.</small>}</div>{(focus.reasons.length>0||ranking==='personal'&&summary.total>0&&personal.reasons.length>0)&&<p className='personalReason'><strong>Varför denna placering:</strong> {[...focus.reasons,...personal.reasons].slice(0,3).join(' · ')}</p>}{x.confirmingSources.length>1&&<p className='confirmingSources'>Liknande träffar: {x.confirmingSources.slice(0,4).join(' · ')}</p>}{x.geographies.length>0&&<div className='newsTags'>{x.geographies.slice(0,3).map(g=><span key={g}>{g}</span>)}</div>}<div className='newsActions'><div className='feedbackButtons'><button className={isSeen(x)?'selected':''} onClick={()=>markSeen(x)} disabled={isSeen(x)} title='Markera som läst'><CheckCircle2 size={13}/>{isSeen(x)?'Läst':'Markera läst'}</button><button className={selected==='important'?'selected':''} onClick={()=>react(x,'important')} title='Prioritera liknande innehåll'><ThumbsUp size={13}/>{feedbackLabel('important')}</button><button className={selected==='irrelevant'?'selected irrelevant':''} onClick={()=>react(x,'irrelevant')} title='Nedprioritera liknande innehåll'><ThumbsDown size={13}/>{feedbackLabel('irrelevant')}</button><button className={selected==='follow'?'selected follow':''} onClick={()=>react(x,'follow')} title='Följ detta ämne extra noga'><Bookmark size={13}/>{feedbackLabel('follow')}</button></div><a href={x.url} target='_blank' rel='noreferrer' onClick={()=>markSeen(x)}>Öppna originalkälla <ExternalLink size={13}/></a></div></article>}):!loading&&<p className='emptyState'>{ranked.length>0?'Du är ikapp – alla händelser i vyn är lästa. Välj “Visa lästa” om du vill gå tillbaka.':'Inga daterade relevanta händelser hittades för filtret.'}</p>}</div>
  </>}
 </section>;
}
