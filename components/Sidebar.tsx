"use client";

import { useEffect, useState } from "react";
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
  const [active,setActive]=useState("top");

  useEffect(()=>{
    const targets=items.map(([, ,target])=>document.getElementById(target)).filter(Boolean) as HTMLElement[];
    if(!targets.length) return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(visible[0]?.target?.id) setActive(visible[0].target.id);
    },{rootMargin:"-10% 0px -70% 0px",threshold:0});
    targets.forEach(x=>observer.observe(x));
    return ()=>observer.disconnect();
  },[]);

  const go=(target:string)=>{
    setActive(target);
    const el=document.getElementById(target);
    if(el) el.scrollIntoView({behavior:"smooth",block:"start"});
  };

  return (
    <aside className="sidebar">
      <div className="brand"><span className="brandMark">B</span><span>Bevakly</span></div>
      <nav aria-label="Huvudnavigation">
        {items.map(([Icon,label,target])=>(
          <a href={`#${target}`} className={active===target?"navItem active":"navItem"} key={label} onClick={(e)=>{e.preventDefault();go(target)}}>
            <Icon size={18} strokeWidth={1.8}/><span>{label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebarFooter">
        <div className="profileDot">B</div>
        <div><strong>Bevakly</strong><span>Omvärldsbevakning</span></div>
      </div>
    </aside>
  );
}
