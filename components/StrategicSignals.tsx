"use client";
import { useEffect, useState } from "react";
import { Activity, RefreshCw, TriangleAlert } from "lucide-react";

type Signal={id:string;title:string;summary:string;rationale:string;confidence:"hög"|"medel"|"låg";severity:"hög"|"medel"|"låg";eventCount:number;categories:string[];competitors:string[];geographies:string[];firstSeen:string|null;lastSeen:string|null};
type Payload={historyEnabled:boolean;historyEventCount:number;reason:string|null;disclaimer:string;signals:Signal[]};

export default function StrategicSignals(){
  const [data,setData]=useState<Payload|null>(null); const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const r=await fetch("/api/signals",{cache:"no-store"});setData(await r.json());}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);
  return <section className="signalsPanel">
    <div className="panelTitle"><div><p className="eyebrow"><Activity size={13}/> STRATEGISKA SIGNALER · v0.6</p><h3>Mönster över tid</h3></div><button onClick={()=>void load()} aria-label="Uppdatera signaler"><RefreshCw size={17} className={loading?"spin":""}/></button></div>
    {!data?.historyEnabled && <div className="signalEmpty"><TriangleAlert size={16}/><span>Historik krävs för riktiga signaler. {data?.reason ?? "Databasen är inte ansluten."}</span></div>}
    {data?.historyEnabled && <p className="smallText">Analyserar {data.historyEventCount} historiska händelser från de senaste 120 dagarna.</p>}
    <div className="signalList">
      {data?.signals.map(s=><article className="signalCard" key={s.id}><div className="signalTop"><span className={`signalSeverity ${s.severity}`}>{s.severity.toUpperCase()}</span><span>{s.eventCount} händelser</span><span>{s.confidence} säkerhet</span></div><h4>{s.title}</h4><p>{s.summary}</p><p className="signalRationale">{s.rationale}</p><div className="signalTags">{s.categories.slice(0,4).map(x=><span key={x}>{x}</span>)}{s.competitors.slice(0,2).map(x=><span key={x}>{x}</span>)}</div><p className="hypothesisLabel">Bevakly-hypotes – inte verifierad fakta.</p></article>)}
      {data?.historyEnabled && !loading && data.signals.length===0 && <p className="emptyState">Ingen tillräckligt stark kombination av historiska händelser har identifierats ännu.</p>}
    </div>
  </section>
}
