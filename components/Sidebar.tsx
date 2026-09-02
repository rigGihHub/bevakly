"use client";

import { Bell, Binoculars, Building2, FileText, Gauge, Radar, Search, Settings, Sparkles } from "lucide-react";

const items = [
  [Gauge, "Översikt", true],
  [Radar, "Händelser", false],
  [Building2, "Konkurrenter", false],
  [Binoculars, "Signaler", false],
  [Radar, "Möjligheter", false],
  [FileText, "Rapporter", false],
  [Sparkles, "Fråga Bevakly", false],
  [Bell, "Bevakningar", false],
  [Search, "Sök", false],
  [Settings, "Inställningar", false],
] as const;

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brandMark">B</span><span>Bevakly</span></div>
      <nav>
        {items.map(([Icon, label, active]) => (
          <button className={active ? "navItem active" : "navItem"} key={label}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebarFooter">
        <div className="profileDot">DE</div>
        <div><strong>Demoorganisation</strong><span>Avfall & återvinning</span></div>
      </div>
    </aside>
  );
}
