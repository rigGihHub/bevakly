"use client";
import { useEffect,useState } from "react";
import { Crosshair, RefreshCw, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
type O={id:string;title:string;thesis:string;score:number;confidence:"medel"|"låg";evidence:string[];gaps:string[];mustBeTrue:string[];killCriteria:string[];nextActions:string[];eventIds:string[];geographies:string[];competitors:string[];categories:string[];disclaimer:string};
type P={historyEnabled:boolean;reason:string|null;eventCount:number;disclaimer:string;opportunities:O[]};
export default function OpportunityRadar(){
 const [data,setData]=useState<P|null>(null);const [loading,setLoading]=useState(true);const [open,setOpen]=useState<string|null>(null);
 const load=async()=>{setLoading(true);try{const r=await fetch("/api/opportunities",{cache:"no-store"});setData(await r.json())}finally{setLoading(false)}};useEffect(()=>{void load()},[]);
 return <section className="opportunityPanel"><div className="panelTitle"><div><p className="eyebrow"><Crosshair size={13}/> OPPORTUNITY RADAR · EXPERIMENTELLT</p><h3>Var kan marknaden lämna en lucka?</h3></div><button onClick={()=>void load()} aria-label="Uppdatera"><RefreshCw size={17} className={loading?"spin":""}/></button></div>
 <p className="smallText">Bevakly letar efter undersökningsvärda affärshypoteser – och försöker samtidigt hitta skäl att döda caset tidigt.</p>
 {!data?.historyEnabled&&<p className="emptyState">Historik krävs. {data?.reason}</p>}
 <div className="opportunityGrid">{data?.opportunities.map(o=><article className="opportunityCard" key={o.id}><div className="opportunityTop"><span className="opScore">Potential {o.score}/100</span><span>{o.confidence} evidens</span></div><h4>{o.title}</h4><p>{o.thesis}</p><div className="evidenceRow">{o.evidence.map(x=><span key={x}>✓ {x}</span>)}</div><button className="inspectButton" onClick={()=>setOpen(open===o.id?null:o.id)}>{open===o.id?"Dölj beslutstest":"Testa caset"}</button>{open===o.id&&<div className="decisionTest"><div><strong><CheckCircle2 size={14}/> Måste vara sant</strong>{o.mustBeTrue.map(x=><span key={x}>• {x}</span>)}</div><div className="kill"><strong><XCircle size={14}/> Döda caset om</strong>{o.killCriteria.map(x=><span key={x}>• {x}</span>)}</div><div><strong><Crosshair size={14}/> Nästa kontroll</strong>{o.nextActions.map(x=><span key={x}>→ {x}</span>)}</div><div className="gap"><ShieldAlert size={14}/><span><strong>Datagap:</strong> {o.gaps.join(" ")}</span></div></div>}<footer>{o.eventIds.length} underliggande händelser · hypotes, ej verifierad affär</footer></article>)}</div>
 {data?.historyEnabled&&!loading&&data.opportunities.length===0&&<p className="emptyState">Inga möjligheter passerar tröskeln ännu. Bevakly visar hellre ingenting än ett tunt affärscase.</p>}
 </section>;
}
