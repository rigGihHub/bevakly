"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, HeartPulse, Loader2, SearchCheck } from "lucide-react";
import type { CustomerPain } from "@/lib/intelligence/customer-pains";

export default function CustomerPainRadar(){
  const [items,setItems]=useState<CustomerPain[]>([]);
  const [loading,setLoading]=useState(true);
  const [reason,setReason]=useState<string|null>(null);

  useEffect(()=>{
    fetch("/api/customer-pains")
      .then(r=>r.json())
      .then(data=>{ setItems(data.pains ?? []); setReason(data.reason ?? null); })
      .catch(()=>setReason("Kunde inte läsa historiken för Customer Pain Radar."))
      .finally(()=>setLoading(false));
  },[]);

  return <section className="painPanel">
    <div className="panelTitle">
      <div><p className="eyebrow"><HeartPulse size={15}/> CUSTOMER PAIN RADAR · BETA</p><h3>Vilka problem verkar kunderna försöka lösa?</h3><p className="smallText">Bevakly söker efter återkommande friktion, krav och inköpsmönster i historiken – innan de blir ett tydligt marknadserbjudande.</p></div>
    </div>
    {loading && <div className="signalEmpty"><Loader2 className="spin" size={16}/> Analyserar historiken efter återkommande kundproblem…</div>}
    {!loading && items.length===0 && <div className="signalEmpty"><SearchCheck size={16}/><div><strong>Inget robust problemkluster ännu</strong><br/>{reason ?? "Bevakly behöver fler historiska händelser innan återkommande kundproblem kan skiljas från enstaka brus."}</div></div>}
    <div className="painGrid">{items.map(item=><article className="painCard" key={item.id}>
      <div className="painTop"><span>Problemstyrka {item.score}/100</span><span>{item.confidence} säkerhet</span></div>
      <h4>{item.title}</h4><p>{item.problem}</p>
      <div className="painEvidence"><strong>Vad Bevakly ser</strong>{item.evidence.slice(0,3).map((e,i)=><span key={i}>{e}</span>)}</div>
      <div className="businessAngle"><strong>Möjlig affärsvinkel</strong><span>{item.businessAngle}</span></div>
      <div className="validateBox"><strong><SearchCheck size={14}/> Verifiera innan ni agerar</strong>{item.validateNext.map((x,i)=><span key={i}>• {x}</span>)}</div>
      <div className="painWarning"><AlertTriangle size={14}/><span>{item.warning}</span></div>
      {(item.geographies.length>0 || item.categories.length>0) && <footer>{[...item.geographies.slice(0,3),...item.categories.slice(0,3)].join(" · ")}</footer>}
    </article>)}</div>
  </section>;
}
