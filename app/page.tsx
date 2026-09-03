"use client";

import { useEffect, useState } from "react";
import { Bell, Building2, Newspaper, Radar, Search, Sparkles, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Onboarding, { type OnboardingSelection } from "@/components/Onboarding";
import IndustryFeed from "@/components/IndustryFeed";
import WatchProfiles from "@/components/WatchProfiles";
import { makeWatchProfile, type WatchProfile } from "@/lib/intelligence/watch-profiles";
import ExecutiveIntelligence from "@/components/ExecutiveIntelligence";
import CompetitorIntelligence from "@/components/CompetitorIntelligence";
import ActorWatchlist from "@/components/ActorWatchlist";
import ActorComparison from "@/components/ActorComparison";
import StrategicMoves from "@/components/StrategicMoves";

type Track = "industry" | "competitors";

export default function Home() {
  const [selection,setSelection]=useState<OnboardingSelection|null>(null);
  const [profiles,setProfiles]=useState<WatchProfile[]>([]);
  const [activeProfileId,setActiveProfileId]=useState('');
  const [track,setTrack]=useState<Track>('industry');
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('bevakly:watch-profiles:v1');
      const stored=raw?JSON.parse(raw) as WatchProfile[]:[];
      if(stored.length){setProfiles(stored);setActiveProfileId(localStorage.getItem('bevakly:active-profile:v1')||stored[0].id);}
    }catch{} finally{setReady(true)}
  },[]);
  useEffect(()=>{if(!ready||!profiles.length)return;try{localStorage.setItem('bevakly:watch-profiles:v1',JSON.stringify(profiles));localStorage.setItem('bevakly:active-profile:v1',activeProfileId||profiles[0].id)}catch{}},[profiles,activeProfileId,ready]);
  useEffect(()=>{
    const onTrack=(event:Event)=>{
      const detail=(event as CustomEvent<Track>).detail;
      if(detail==='industry'||detail==='competitors') setTrack(detail);
    };
    window.addEventListener('bevakly:track',onTrack);
    return ()=>window.removeEventListener('bevakly:track',onTrack);
  },[]);

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
      <header className="topbar"><div><p className="eyebrow">BEVAKLY · OMVÄRLDSBEVAKNING · v2.18.0</p><h1>Vad händer i branschen?</h1><p>Följ nyhetsläget eller växla över till en samlad analys av vad konkurrenterna faktiskt håller på med.</p></div><div className="topActions"><button><Search size={18}/></button><button><Bell size={18}/><span className="notificationDot"/></button></div></header>

      <div id="watch-profiles" className="navAnchor"><WatchProfiles profiles={profiles} activeId={activeProfile.id} onChange={setProfiles} onActive={setActiveProfileId}/></div>

      <section className="statusStrip">
        <div><span className="statusIcon"><Radar size={18}/></span><p><strong>{activeProfile.name}</strong><span>{activeProfile.market} · {activeProfile.themes.slice(0,2).join(' · ')||'bred bevakning'}</span></p></div>
        <div><span className="statusIcon"><TrendingUp size={18}/></span><p><strong>Automatisk bevakning</strong><span>riktiga källor · uppdateras dagligen</span></p></div>
        <div><span className="statusIcon"><Sparkles size={18}/></span><p><strong>Relevant först</strong><span>nyheter, signaler och mönster samlade</span></p></div>
      </section>

      <section className="trackSwitcher" aria-label="Välj bevakningsspår">
        <button className={track==='industry'?'active':''} onClick={()=>setTrack('industry')}>
          <Newspaper size={22}/><span><strong>Branschen</strong><small>Generella nyheter, regler, teknik, investeringar och marknadsförändringar.</small></span>
        </button>
        <button className={track==='competitors'?'active':''} onClick={()=>setTrack('competitors')}>
          <Building2 size={22}/><span><strong>Konkurrenterna</strong><small>Vad de gör, vad som förändras och vilka mönster Bevakly ser.</small></span>
        </button>
      </section>

      {track==='industry' ? <>
        <div id="industry-feed" className="navAnchor"><IndustryFeed industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} profile={activeProfile} /></div>
        <details className="analysisDrawer" id="signals">
          <summary><span><strong>Fördjupa branschbilden</strong><small>Trender, svaga signaler, motbevis och utveckling över tid.</small></span><span className="analysisDrawerAction">Fördjupa</span></summary>
          <div className="analysisDrawerBody"><ExecutiveIntelligence industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} /></div>
        </details>
      </> : <section id="actors" className="competitorTrack navAnchor">
        <div className="trackIntro"><p className="eyebrow">KONKURRENTANALYS</p><h2>Vad håller konkurrenterna på med?</h2><p>Bevakly samlar händelser per aktör och letar efter förändringar i aktivitet, teman, geografi och möjliga strategiska förflyttningar. Hypoteser hålls tydligt isär från fakta.</p></div>
        {activeProfile.actors.length>0 ? <>
          <ActorWatchlist actors={activeProfile.actors} />
          {activeProfile.actors.length>1&&<ActorComparison actors={activeProfile.actors} />}
          {activeProfile.industry==="waste"&&<CompetitorIntelligence />}
          <div id="strategic-moves"><StrategicMoves actors={activeProfile.actors} /></div>
        </> : <div className="emptyTrack"><Building2 size={24}/><strong>Inga konkurrenter valda ännu</strong><p>Lägg till företag under Bevakningar så bygger Bevakly konkurrentanalysen här.</p></div>}
      </section>}
    </main>
  </div>;
}
