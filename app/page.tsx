"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Newspaper, Radar, RefreshCw, Search, Sparkles, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Onboarding, { type OnboardingSelection } from "@/components/Onboarding";
import NewsFirstFeed from "@/components/NewsFirstFeed";
import WatchProfiles from "@/components/WatchProfiles";
import { makeWatchProfile, type WatchProfile } from "@/lib/intelligence/watch-profiles";
import { APP_VERSION } from "@/lib/version";

type Track = "industry" | "competitors";

export default function Home() {
  const [selection,setSelection]=useState<OnboardingSelection|null>(null);
  const [profiles,setProfiles]=useState<WatchProfile[]>([]);
  const [activeProfileId,setActiveProfileId]=useState('');
  const [track,setTrack]=useState<Track>('industry');
  const [ready,setReady]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [lastRefresh,setLastRefresh]=useState<string|null>(null);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('bevakly:watch-profiles:v1');
      const stored=raw?JSON.parse(raw) as WatchProfile[]:[];
      if(stored.length){setProfiles(stored);setActiveProfileId(localStorage.getItem('bevakly:active-profile:v1')||stored[0].id);}
    }catch{} finally{setReady(true)}
  },[]);
  useEffect(()=>{if(!ready||!profiles.length)return;try{localStorage.setItem('bevakly:watch-profiles:v1',JSON.stringify(profiles));localStorage.setItem('bevakly:active-profile:v1',activeProfileId||profiles[0].id)}catch{}},[profiles,activeProfileId,ready]);
  useEffect(()=>{
    try{setLastRefresh(localStorage.getItem('bevakly:last-refresh:v1'))}catch{}
    const onRefreshDone=(event:Event)=>{const detail=(event as CustomEvent<{fetchedAt?:string}>).detail; const ts=detail?.fetchedAt||new Date().toISOString(); setLastRefresh(ts); setRefreshing(false); try{localStorage.setItem('bevakly:last-refresh:v1',ts)}catch{}};
    const onRefreshError=()=>setRefreshing(false);
    window.addEventListener('bevakly:refresh-done',onRefreshDone);
    window.addEventListener('bevakly:refresh-error',onRefreshError);
    return ()=>{window.removeEventListener('bevakly:refresh-done',onRefreshDone);window.removeEventListener('bevakly:refresh-error',onRefreshError)};
  },[]);
  useEffect(()=>{
    const onTrack=(event:Event)=>{const detail=(event as CustomEvent<Track>).detail;if(detail==='industry'||detail==='competitors')setTrack(detail)};
    window.addEventListener('bevakly:track',onTrack);
    return ()=>window.removeEventListener('bevakly:track',onTrack);
  },[]);

  const refreshAll=()=>{if(refreshing)return;setRefreshing(true);window.setTimeout(()=>window.dispatchEvent(new CustomEvent('bevakly:refresh-all')),80)};
  const completeOnboarding=(sel:OnboardingSelection)=>{
    const initial=makeWatchProfile({name:`${sel.industry==='waste'?'Avfall Sverige':'Min bevakning'}`,industry:sel.industry,customIndustry:sel.customIndustry,market:sel.market,regions:sel.regions.split(',').map(x=>x.trim()).filter(Boolean),actors:sel.competitors});
    setSelection(sel);setProfiles([initial]);setActiveProfileId(initial.id);
  };
  if(!ready) return null;
  if (!profiles.length && !selection) return <Onboarding onDone={completeOnboarding} />;
  const activeProfile=profiles.find(x=>x.id===activeProfileId)??profiles[0];
  if(!activeProfile) return <Onboarding onDone={completeOnboarding} />;

  return <div className="appShell">
    <Sidebar />
    <main className="main" id="top">
      <header className="topbar"><div><p className="eyebrow">BEVAKLY · OMVÄRLDSBEVAKNING · v{APP_VERSION}</p><h1>Vad händer i branschen?</h1><p>Färska nyheter först. Fördjupning kommer efter att nyhetsflödet faktiskt levererat.</p></div><div className="topActions"><button className="globalRefreshButton" onClick={refreshAll} disabled={refreshing} title="Hämta färsk information från källorna"><RefreshCw size={17} className={refreshing?'spin':''}/><span><strong>{refreshing?'Hämtar…':'Uppdatera bevakning'}</strong><small>{lastRefresh?`Senast ${new Date(lastRefresh).toLocaleString('sv-SE',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'})}`:'Hämta färsk info nu'}</small></span></button><button aria-label="Sök"><Search size={18}/></button><button aria-label="Notiser"><Bell size={18}/><span className="notificationDot"/></button></div></header>

      <div id="watch-profiles" className="navAnchor"><WatchProfiles profiles={profiles} activeId={activeProfile.id} onChange={setProfiles} onActive={setActiveProfileId}/></div>

      <section className="statusStrip">
        <div><span className="statusIcon"><Radar size={18}/></span><p><strong>{activeProfile.name}</strong><span>{activeProfile.market} · {activeProfile.themes.slice(0,2).join(' · ')||'bred bevakning'}</span></p></div>
        <div><span className="statusIcon"><TrendingUp size={18}/></span><p><strong>Färskdata</strong><span>7 dagar · manuellt uppdateringsbar</span></p></div>
        <div><span className="statusIcon"><Sparkles size={18}/></span><p><strong>Nyheter först</strong><span>diagnostik bara när den behövs</span></p></div>
      </section>

      <section className="trackSwitcher" aria-label="Välj bevakningsspår">
        <button className={track==='industry'?'active':''} onClick={()=>setTrack('industry')}>
          <Newspaper size={22}/><span><strong>Branschen</strong><small>Senaste relevanta branschnyheterna.</small></span>
        </button>
        <button className={track==='competitors'?'active':''} onClick={()=>setTrack('competitors')}>
          <Building2 size={22}/><span><strong>Konkurrenterna</strong><small>Senaste nytt om bolagen du bevakar.</small></span>
        </button>
      </section>

      <div className="navAnchor"><NewsFirstFeed industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} profile={activeProfile} focus={track}/></div>
    </main>
  </div>;
}
