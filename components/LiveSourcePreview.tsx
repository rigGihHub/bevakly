"use client";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Radio, ShieldCheck, TriangleAlert, Building2, MapPin, CalendarDays } from "lucide-react";

type PreviewItem={title:string;url:string;source:string;sourceCount:number;score:number;importance:string;publishedAt:string|null;competitors:string[];geographies:string[];factualSummary:string;articleReadOk:boolean;signalType?:"web"|"procurement";assessment?:{category:string;interpretation:string;watchNext:string[];confidence:string;hypothesis:boolean};deadline?:string|null;buyer?:string|null;estimatedValue?:string|null;currency?:string|null};
type Preview={fetchedAt:string;disclaimer:string;totalRawHits:number;totalClusters:number;tedQuery?:string;persistence?:{enabled:boolean;saved:number;reason?:string|null};sourceStatus:Array<{id:string;name:string;ok:boolean;hits:number;error?:string|null}>;items:PreviewItem[]};
function dateLabel(value:string|null){ if(!value) return "Datum ej säkert identifierat"; try{return new Intl.DateTimeFormat("sv-SE",{dateStyle:"medium"}).format(new Date(value));}catch{return "Datum ej säkert identifierat";} }
export default function LiveSourcePreview(){
 const [data,setData]=useState<Preview|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState<string|null>(null);
 const load=async()=>{setLoading(true);setError(null);try{const r=await fetch("/api/source-preview",{cache:"no-store"});if(!r.ok)throw new Error(`HTTP ${r.status}`);setData(await r.json());}catch(e){setError(e instanceof Error?e.message:"Källmotorn kunde inte laddas");}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 return <section className="livePanel">
  <div className="liveHeader"><div><p className="eyebrow"><Radio size={13}/> LIVE KÄLLMOTOR · v0.6</p><h2>Källgrundade händelser</h2><p>Hämtning → artikeltext → datum → företag/geografi → score → faktasammanfattning.</p></div><button className="filterButton" onClick={()=>void load()} disabled={loading}><RefreshCw size={15} className={loading?"spin":""}/>{loading?"Hämtar":"Uppdatera"}</button></div>
  <div className="sourceDisclaimer"><TriangleAlert size={16}/><span><strong>Fakta och bedömning hålls isär.</strong> “Fakta från källan” kommer från originalmaterialet. “Bevakly bedömer” är en maskinell hypotes och får aldrig läsas som verifierad fakta.</span></div>
  {error&&<div className="sourceError">Källmotorn svarade inte: {error}</div>}
  {data&&<><div className="sourceStats"><span><strong>{data.totalRawHits}</strong> råträffar</span><span><strong>{data.totalClusters}</strong> händelser</span><span><ShieldCheck size={14}/>{data.sourceStatus.filter(s=>s.ok).length}/{data.sourceStatus.length} källor svarade</span></div>
  <div className="sourceHealth">{data.sourceStatus.map(s=><span key={s.id} className={s.ok?"sourceOk":"sourceBad"}>{s.name}: {s.ok?`${s.hits} träffar`:"fel"}</span>)}</div>
  {data.persistence&&<p className="historyStatus">{data.persistence.enabled?`Historik: ${data.persistence.saved} händelser sparade i Supabase.`:`Historik avstängd: ${data.persistence.reason??"ej konfigurerad"}`}</p>}
  <div className="liveList">{data.items.length?data.items.map(item=><article className="liveItem" key={`${item.source}-${item.url}`}>
   <div className="eventTopline"><span className={`score score-${item.score>=75?"high":"normal"}`}>{item.score}</span><span className="importance">{item.importance}</span><span className="category">{item.signalType==="procurement"?"Upphandling":item.assessment?.category??"Källgrundad"}</span><span className="liveBadge">LIVE</span></div>
   <h3>{item.title}</h3><div className="eventMeta"><span>{item.source}</span><span>•</span><span>{item.sourceCount} {item.sourceCount===1?"källa":"liknande träffar"}</span></div>
   <p className="liveSummary"><strong>FAKTA FRÅN KÄLLAN:</strong> {item.factualSummary}</p>
   {item.assessment&&<div className="assessmentBox"><p className="assessmentLabel">BEVAKLY BEDÖMER · {item.assessment.confidence.toUpperCase()} SÄKERHET</p><p>{item.assessment.interpretation}</p><p className="hypothesisLabel">Maskinell hypotes – inte verifierad fakta.</p><div className="watchNext"><strong>Bevaka härnäst:</strong>{item.assessment.watchNext.map(x=><span key={x}>{x}</span>)}</div></div>}
   <div className="entityRow"><span><CalendarDays size={13}/>{dateLabel(item.publishedAt)}</span>{item.competitors.length>0&&<span><Building2 size={13}/>{item.competitors.join(", ")}</span>}{item.geographies.length>0&&<span><MapPin size={13}/>{item.geographies.slice(0,3).join(", ")}</span>}</div>
   {!item.articleReadOk&&<p className="articleWarning">Bevakly kunde läsa listträffen men inte hela artikeln.</p>}
   <a className="sourceLink" href={item.url} target="_blank" rel="noreferrer">Öppna originalkälla <ExternalLink size={14}/></a>
  </article>):!loading&&<p className="emptyState">Inga relevanta träffar hittades i de aktiva källorna just nu.</p>}</div></>}
 </section>;
}
