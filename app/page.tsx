"use client";

import { useEffect, useState } from "react";
import { Bell, Radar, Search, Sparkles, TrendingUp } from "lucide-react";
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

export default function Home() {
  const [selection,setSelection]=useState<OnboardingSelection|null>(null);
  const [profiles,setProfiles]=useState<WatchProfile[]>([]);
  const [activeProfileId,setActiveProfileId]=useState('');
  const [ready,setReady]=useState(false);

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
    <main className="main" id="top">
      <header className="topbar"><div><p className="eyebrow">BEVAKLY · OMVÄRLDSBEVAKNING · v2.10.0</p><h1>Det viktigaste först.</h1><p>På en minut ska du förstå vad som har förändrats, varför det spelar roll och vad som är värt att följa.</p></div><div className="topActions"><button><Search size={18}/></button><button><Bell size={18}/><span className="notificationDot"/></button></div></header>

      <div id="watch-profiles" className="navAnchor"><WatchProfiles profiles={profiles} activeId={activeProfile.id} onChange={setProfiles} onActive={setActiveProfileId}/></div>

      <section className="statusStrip">
        <div><span className="statusIcon"><Radar size={18}/></span><p><strong>{activeProfile.name}</strong><span>{activeProfile.market} · {activeProfile.themes.slice(0,2).join(' · ')||'bred bevakning'}</span></p></div>
        <div><span className="statusIcon"><TrendingUp size={18}/></span><p><strong>Automatisk bevakning</strong><span>riktiga källor · uppdateras dagligen</span></p></div>
        <div><span className="statusIcon"><Sparkles size={18}/></span><p><strong>Färre, bättre insikter</strong><span>viktigt först · detaljer vid behov</span></p></div>
      </section>

      <div id="industry-feed" className="navAnchor"><IndustryFeed industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} profile={activeProfile} /></div>
      <details className="analysisDrawer" id="signals">
        <summary><span><strong>Visa analysen bakom</strong><small>Trender, svaga signaler, motbevis och andra fördjupningar.</small></span><span className="analysisDrawerAction">Fördjupa</span></summary>
        <div className="analysisDrawerBody"><ExecutiveIntelligence industry={activeProfile.industry} customIndustry={activeProfile.customIndustry} /></div>
      </details>

      {activeProfile.actors.length>0&&<details className="analysisDrawer" id="actors">
        <summary><span><strong>Konkurrenter</strong><small>Aktivitet, jämförelser och utveckling för aktörerna du bevakar.</small></span><span className="analysisDrawerAction">Öppna</span></summary>
        <div className="analysisDrawerBody"><ActorWatchlist actors={activeProfile.actors} />{activeProfile.actors.length>1&&<ActorComparison actors={activeProfile.actors} />}{activeProfile.industry==="waste"&&<CompetitorIntelligence />}</div>
      </details>}

      {activeProfile.actors.length>0&&<details className="analysisDrawer" id="strategic-moves">
        <summary><span><strong>Strategiska drag</strong><small>Försiktiga hypoteser om större förflyttningar – med stöd och motbevis.</small></span><span className="analysisDrawerAction">Öppna</span></summary>
        <div className="analysisDrawerBody"><StrategicMoves actors={activeProfile.actors} /></div>
      </details>}
    </main>
  </div>;
}
