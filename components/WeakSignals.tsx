"use client";
import { useEffect,useState } from "react";
import { Eye, RefreshCw, ShieldQuestion } from "lucide-react";
type S={id:string;title:string;hypothesis:string;whyNow:string;confidence:"hög"|"medel"|"låg";signalStrength:number;eventIds:string[];competitors:string[];geographies:string[];categories:string[];watchFor:string[];counterEvidence:string};
type Payload={historyEnabled:boolean;reason:string|null;eventCount:number;disclaimer:string;signals:S[]};
export default function WeakSignals(){const [data,setData]=useState<Payload|null>(null);const [loading,setLoading]=useState(true);const load=async()=>{setLoading(true);try{const r=await fetch("/api/weak-signals",{cache:"no-store"});setData(await r.json())}finally{setLoading(false)}};useEffect(()=>{void load()},[]);
 return <section className="weakPanel"><div className="panelTitle"><div><p className="eyebrow"><Eye size={13}/> SVAGA SIGNALER · EXPERIMENTELLT</p><h3>Vad kan vara på väg att hända?</h3></div><button onClick={()=>void load()}><RefreshCw size={17} className={loading?"spin":""}/></button></div>
 <p className="smallText">Bevakly letar efter kombinationer som är för små för att vara en nyhet var för sig. Detta är hypotesgenerering, inte prognoser.</p>
 {!data?.historyEnabled&&<p className="emptyState">Historik krävs. {data?.reason}</p>}
 <div className="weakGrid">{data?.signals.map(s=><article className="weakCard" key={s.id}><div className="weakScore"><span>Signalstyrka</span><strong>{s.signalStrength}/100</strong></div><h4>{s.title}</h4><p>{s.hypothesis}</p><div className="whyNow"><strong>Varför nu?</strong><span>{s.whyNow}</span></div><div className="watchList"><strong>Bevaka för bekräftelse</strong>{s.watchFor.map(x=><span key={x}>→ {x}</span>)}</div><div className="counter"><ShieldQuestion size={14}/><span><strong>Vad talar emot?</strong> {s.counterEvidence}</span></div><footer>{s.confidence} säkerhet · {s.eventIds.length} underliggande händelser</footer></article>)}</div>
 {data?.historyEnabled&&!loading&&data.signals.length===0&&<p className="emptyState">Inga svaga signaler passerar tröskeln ännu. Det är bättre än att fylla dashboarden med spekulation.</p>}
 </section>}
