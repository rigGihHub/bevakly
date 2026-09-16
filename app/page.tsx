"use client";

import { useEffect, useState } from "react";
import { Building2, Grid2X2, Newspaper, RefreshCw, Sparkles } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Onboarding, { type OnboardingSelection } from "@/components/Onboarding";
import NewsFirstFeed from "@/components/NewsFirstFeed";
import WatchProfiles from "@/components/WatchProfiles";
import { makeWatchProfile, type WatchProfile } from "@/lib/intelligence/watch-profiles";
import { APP_VERSION } from "@/lib/version";

type Track = "industry" | "competitors" | "ai-tools" | "google-workspace";

const SPECIAL_PROFILES:Record<'ai-tools'|'google-workspace',WatchProfile>={
  'ai-tools':{id:'special-ai-tools',name:'AI-verktyg',industry:'ai-tools',market:'Internationellt',regions:[],actors:[],themes:['Produktlanseringar','Modeller','Integrationer','Pris & tillgång','Säkerhet'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'},
  'google-workspace':{id:'special-google-workspace',name:'Google Workspace',industry:'google-workspace',market:'Internationellt',regions:[],actors:[],themes:['Nya funktioner','Administratör','Utrullning','Säkerhet','AI'],createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'},
};

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
    const onTrack=(event:Event)=>{const detail=(event as CustomEvent<Track>).detail;if(['industry','competitors','ai-tools','google-workspace'].includes(detail))setTrack(detail)};
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
      <header className="topbar" style={{alignItems:'center'}}>
        <div><p className="eyebrow">BEVAKLY · v{APP_VERSION}</p><h1 style={{marginBottom:0}}>Senaste nytt</h1></div>
        <button className="globalRefreshButton" onClick={refreshAll} disabled={refreshing} title="Hämta färsk information"><RefreshCw size={17} className={refreshing?'spin':''}/><span><strong>{refreshing?'Hämtar…':'Uppdatera'}</strong><small>{lastRefresh?`Senast ${new Date(lastRefresh).toLocaleString('sv-SE',{hour:'2-digit',minute:'2-digit'})}`:'Hämta nytt'}</small></span></button>
      </header>

      <div id="watch-profiles" className="navAnchor"><WatchProfiles profiles={profiles} activeId={activeProfile.id} onChange={setProfiles} onActive={setActiveProfileId}/></div>

      <section className="trackSwitcher" aria-label="Välj bevakningsspår" style={{marginTop:8,marginBottom:10}}>
        <button className={track==='industry'?'active':''} onClick={()=>setTrack('industry')}><Newspaper size={18}/><span><strong>Branschen</strong></span></button>
        <button className={track==='competitors'?'active':''} onClick={()=>setTrack('competitors')}><Building2 size={18}/><span><strong>Konkurrenterna</strong></span></button>
        <button className={track==='ai-tools'?'active':''} onClick={()=>setTrack('ai-tools')}><Sparkles size={18}/><span><strong>AI-verktyg</strong><small>ChatGPT, Gemini, Claude, Copilot m.fl.</small></span></button>
        <button className={track==='google-workspace'?'active':''} onClick={()=>setTrack('google-workspace')}><Grid2X2 size={18}/><span><strong>Google Workspace</strong><small>Gmail, Drive, Docs, Meet m.fl.</small></span></button>
      </section>

      <div className="navAnchor">{track==='ai-tools'||track==='google-workspace'
        ?<NewsFirstFeed industry={track} profile={SPECIAL_PROFILES[track]} focus={track} days={30}/>
        :<NewsFirstFeed industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} profile={activeProfile} focus={track} days={30}/>
      }</div>
    </main>
  </div>;
}
