"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronRight, Filter, Radar, Search, Sparkles, TrendingUp } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import EventCard from "@/components/EventCard";
import Onboarding, { type OnboardingSelection } from "@/components/Onboarding";
import IndustryFeed from "@/components/IndustryFeed";
import WatchProfiles from "@/components/WatchProfiles";
import { makeWatchProfile, type WatchProfile } from "@/lib/intelligence/watch-profiles";
import ExecutiveIntelligence from "@/components/ExecutiveIntelligence";
import CompetitorIntelligence from "@/components/CompetitorIntelligence";
import ActorWatchlist from "@/components/ActorWatchlist";
import ActorComparison from "@/components/ActorComparison";
import StrategicMoves from "@/components/StrategicMoves";
import { competitors, events } from "@/lib/demo-data";

export default function Home() {
  const [selection,setSelection]=useState<OnboardingSelection|null>(null);
  const [profiles,setProfiles]=useState<WatchProfile[]>([]);
  const [activeProfileId,setActiveProfileId]=useState('');
  const [ready,setReady]=useState(false);
  const sortedEvents = useMemo(() => [...events].sort((a,b)=>b.score-a.score), []);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem('bevakly:watch-profiles:v1');
      const stored=raw?JSON.parse(raw) as WatchProfile[]:[];
      if(stored.length){setProfiles(stored);setActiveProfileId(localStorage.getItem('bevakly:active-profile:v1')||stored[0].id);}
    }catch{} finally{setReady(true)}
  },[]);
  useEffect(()=>{if(!ready||!profiles.length)return;try{localStorage.setItem('bevakly:watch-profiles:v1',JSON.stringify(profiles));localStorage.setItem('bevakly:active-profile:v1',activeProfileId||profiles[0].id)}catch{}},[profiles,activeProfileId,ready]);

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
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">BEVAKLY · OMVÄRLDSBEVAKNING</p><h1>Vad behöver jag veta?</h1><p>Bevakly prioriterar förändringar som kan påverka marknaden – inte mängden nyheter.</p></div><div className="topActions"><button><Search size={18}/></button><button><Bell size={18}/><span className="notificationDot"/></button></div></header>

      <WatchProfiles profiles={profiles} activeId={activeProfile.id} onChange={setProfiles} onActive={setActiveProfileId}/>

      <section className="statusStrip">
        <div><span className="statusIcon"><Radar size={18}/></span><p><strong>{activeProfile.name}</strong><span>{activeProfile.market} · {activeProfile.themes.slice(0,2).join(' · ')||'bred bevakning'}</span></p></div>
        <div><span className="statusIcon"><TrendingUp size={18}/></span><p><strong>Strategisk intelligence</strong><span>impact · trender · svaga signaler · blind spots</span></p></div>
        <div><span className="statusIcon"><Sparkles size={18}/></span><p><strong>Tydlig produktgräns</strong><span>Bevakly ≠ Anbudify</span></p></div>
      </section>

      <IndustryFeed industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} profile={activeProfile} />
      <ExecutiveIntelligence industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} />
      {activeProfile.actors.length>0&&<ActorWatchlist actors={activeProfile.actors} />}
      {activeProfile.actors.length>1&&<ActorComparison actors={activeProfile.actors} />}
      {activeProfile.actors.length>0&&<StrategicMoves actors={activeProfile.actors} />}
      {activeProfile.industry==="waste"&&<CompetitorIntelligence />}

      {activeProfile.industry==="waste"&&<div className="contentGrid">
        <section>
          <div className="sectionHeader"><div><p className="eyebrow">DEMOUNDERLAG · AVFALL</p><h2>Exempel på prioriterade händelser</h2></div><button className="filterButton"><Filter size={16}/> Filter</button></div>
          <div className="demoNotice"><strong>Demo/testdata</strong><span>Detta exempelunderlag visas bara för avfallsprofilen. Branschflödet ovan är den riktiga källvyn.</span></div>
          <div className="eventList">{sortedEvents.map(e=><EventCard event={e} key={e.id}/>)}</div>
        </section>
        <aside className="rightRail">
          <section className="panel"><div className="panelTitle"><div><p className="eyebrow">KONKURRENTER · DEMO</p><h3>Mest aktiva</h3></div><button><ChevronRight size={18}/></button></div>
            <div className="competitorList">{competitors.map((c,i)=><div className="competitorRow" key={c.id}><span className="rank">{i+1}</span><div><strong>{c.name}</strong><span>{c.latestSignal}</span></div><div className="activity"><strong>{c.activityScore}</strong><span>aktivitet</span></div></div>)}</div>
          </section>
          <section className="panel"><p className="eyebrow">BEVAKLY PRINCIP</p><h3>Färre, bättre insikter</h3><p className="smallText">Bevakly ska hellre visa fem belagda förändringar än femtio lösa träffar. Upphandlingsarbete, kvalificering och anbudsprocess hör hemma i Anbudify.</p></section>
        </aside>
      </div>}
    </main>
  </div>;
}
