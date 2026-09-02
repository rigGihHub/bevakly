"use client";
import { useEffect,useState } from "react";
import { Building2, TrendingDown, TrendingUp, Minus, RefreshCw } from "lucide-react";
type E={id:string;title:string;category:string|null;publishedAt:string|null;relevanceScore:number|null;geography:string|null;sourceUrl?:string|null};
type P={name:string;eventCount120d:number;eventCount30d:number;previous30d:number;momentum:"accelererar"|"stabil"|"avtar";momentumPct:number|null;averageScore:number;latestEventAt:string|null;categories:{name:string;count:number}[];geographies:{name:string;count:number}[];timeline:E[]};
type Payload={historyEnabled:boolean;reason:string|null;eventCount:number;profiles:P[]};
export default function CompetitorIntelligence(){
 const [data,setData]=useState<Payload|null>(null);const [loading,setLoading]=useState(true);const [selected,setSelected]=useState<string|null>(null);
 const load=async()=>{setLoading(true);try{const r=await fetch("/api/competitor-profiles",{cache:"no-store"});const d=await r.json();setData(d);if(!selected&&d.profiles?.[0])setSelected(d.profiles[0].name)}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);const p=data?.profiles.find(x=>x.name===selected)??data?.profiles[0];
 const M=p?.momentum==="accelererar"?TrendingUp:p?.momentum==="avtar"?TrendingDown:Minus;
 return <section className="intelPanel"><div className="panelTitle"><div><p className="eyebrow"><Building2 size={13}/> KONKURRENTINTELLIGENCE · v0.7</p><h3>Vad förändras hos konkurrenterna?</h3></div><button onClick={()=>void load()} aria-label="Uppdatera"><RefreshCw size={17} className={loading?"spin":""}/></button></div>
 {!data?.historyEnabled&&<p className="emptyState">Historik krävs för riktiga konkurrentprofiler. {data?.reason}</p>}
 {data?.historyEnabled&&data.profiles.length===0&&<p className="emptyState">Ingen konkurrenthistorik finns ännu.</p>}
 {p&&<div className="intelGrid"><div className="competitorTabs">{data?.profiles.slice(0,8).map(x=><button key={x.name} onClick={()=>setSelected(x.name)} className={x.name===p.name?"active":""}><strong>{x.name}</strong><span>{x.eventCount30d} händelser · 30 d</span></button>)}</div><div className="profileDetail"><div className="profileHeadline"><div><h4>{p.name}</h4><span className={`momentum ${p.momentum}`}><M size={14}/>{p.momentum}{p.momentumPct!==null?` ${p.momentumPct>0?"+":""}${p.momentumPct}%`:""}</span></div><div className="profileStats"><span><strong>{p.eventCount30d}</strong>30 dagar</span><span><strong>{p.eventCount120d}</strong>120 dagar</span><span><strong>{p.averageScore}</strong>snittscore</span></div></div>
 <div className="profileTags"><div><small>Tyngdpunkter</small>{p.categories.map(x=><span key={x.name}>{x.name} · {x.count}</span>)}</div><div><small>Geografi</small>{p.geographies.length?p.geographies.map(x=><span key={x.name}>{x.name} · {x.count}</span>):<span>Ingen tydlig geografi</span>}</div></div>
 <div className="timeline"><small>SENASTE HÄNDELSER</small>{p.timeline.slice(0,6).map(e=><article key={e.id}><time>{e.publishedAt?new Date(e.publishedAt).toLocaleDateString("sv-SE"):"Datum saknas"}</time><div><strong>{e.title}</strong><span>{e.category??"Övrigt"}{e.geography?` · ${e.geography}`:""}{typeof e.relevanceScore==="number"?` · ${e.relevanceScore}/100`:""}</span></div></article>)}</div></div></div>}
 </section>
}
