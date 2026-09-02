"use client";

import { Binoculars, Building2, Gauge, Radar, Settings2, TrendingUp } from "lucide-react";

const items = [
  [Gauge, "Översikt", "top"],
  [Radar, "Branschflöde", "industry-feed"],
  [Building2, "Konkurrenter", "actors"],
  [Binoculars, "Signaler", "signals"],
  [TrendingUp, "Strategiska drag", "strategic-moves"],
  [Settings2, "Bevakningar", "watch-profiles"],
] as const;

export default function Sidebar() {
  const go = (target:string) => {
    const el=document.getElementById(target);
    if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
  };
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brandMark">B</span><span>Bevakly</span></div>
      <nav aria-label="Huvudnavigation">
        {items.map(([Icon,label,target],index)=>(
          <button type="button" className={index===0?"navItem active":"navItem"} key={label} onClick={()=>go(target)}>
            <Icon size={18} strokeWidth={1.8}/><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebarFooter">
        <div className="profileDot">B</div>
        <div><strong>Bevakly</strong><span>Omvärldsbevakning</span></div>
      </div>
    </aside>
  );
}
