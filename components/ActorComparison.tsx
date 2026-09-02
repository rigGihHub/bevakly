"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, RefreshCw, ShieldAlert, TrendingDown, TrendingUp, Minus } from "lucide-react";

type Momentum='accelererar'|'stabil'|'avtar';
type Row={name:string;activity30:number;activity90:number;momentum:Momentum;sourceDomains:number;averageScore:number;topCategory:string|null;topGeography:string|null;evidenceLevel:'stark'|'medel'|'tunn';breadthScore:number};
type ThemeActor={name:string;current30:number;previous30:number;delta:number;direction:'accelererar'|'stabil'|'avtar'|'ny'};
type Theme={theme:string;actors:ThemeActor[];leader:string|null;note:string};
type Comparison={actors:Row[];themes:Theme[];observations:string[];caveats:string[]};
type Payload={historyEnabled:boolean;reason:string|null;eventCount:number;comparison:Comparison|null;disclaimer:string};

function MomentumIcon({value}:{value:Momentum}){const Icon=value==='accelererar'?TrendingUp:value==='avtar'?TrendingDown:Minus;return <span className={`compareMomentum ${value}`}><Icon size={13}/>{value}</span>}
function directionLabel(v:ThemeActor['direction']){return v==='ny'?'ny':v==='accelererar'?'upp':v==='avtar'?'ned':'stabil'}

export default function ActorComparison({actors}:{actors:string[]}){
  const initial=useMemo(()=>actors.slice(0,Math.min(4,actors.length)),[actors]);
  const [selected,setSelected]=useState<string[]>(initial); const [data,setData]=useState<Payload|null>(null); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(true);
  useEffect(()=>setSelected(prev=>{const kept=prev.filter(x=>actors.includes(x));for(const a of actors){if(kept.length>=4)break;if(!kept.includes(a))kept.push(a)}return kept.slice(0,4)}),[actors]);
  const key=selected.join(',');
  const load=async()=>{if(selected.length<2){setData(null);return}setLoading(true);try{const qs=new URLSearchParams({actors:key});const r=await fetch(`/api/actor-comparison?${qs}`,{cache:'no-store'});setData(await r.json() as Payload)}finally{setLoading(false)}};
  useEffect(()=>{void load()},[key]);
  const toggle=(name:string)=>setSelected(prev=>prev.includes(name)?(prev.length>2?prev.filter(x=>x!==name):prev):(prev.length<4?[...prev,name]:prev));
  if(actors.length<2)return null;
  return <section className="actorCompare"><div className="actorCompareHead"><div><p className="eyebrow"><BarChart3 size={13}/> ACTOR COMPARISON · v2.0</p><h2>Vilka aktörer rör sig – och inom vad?</h2><p>Jämför observerad aktivitet, förändringstakt och källbredd. Inte en tävling i antal pressmeddelanden.</p></div><div className="compareHeadActions"><button className="textButton" onClick={()=>setOpen(v=>!v)}>{open?'Dölj':'Visa'}</button><button className="iconButton" onClick={()=>void load()} aria-label="Uppdatera jämförelse"><RefreshCw size={17} className={loading?'spin':''}/></button></div></div>
  {open&&<><div className="actorPicker">{actors.slice(0,8).map(a=><button key={a} className={selected.includes(a)?'selected':''} onClick={()=>toggle(a)}><span>{selected.includes(a)&&<Check size={12}/>}</span>{a}</button>)}</div>
  {data&&!data.historyEnabled&&<div className="emptyState">Historik krävs för jämförelsen. {data.reason}</div>}
  {data?.comparison&&<div className="compareBody"><div className="compareTableWrap"><table className="compareTable"><thead><tr><th>Mått</th>{data.comparison.actors.map(a=><th key={a.name}>{a.name}<small>{a.evidenceLevel} underlag</small></th>)}</tr></thead><tbody>
    <tr><td>Aktivitet · 30 d</td>{data.comparison.actors.map(a=><td key={a.name}><strong>{a.activity30}</strong><small>{a.activity90} · 90 d</small></td>)}</tr>
    <tr><td>Momentum</td>{data.comparison.actors.map(a=><td key={a.name}><MomentumIcon value={a.momentum}/></td>)}</tr>
    <tr><td>Källbredd</td>{data.comparison.actors.map(a=><td key={a.name}><strong>{a.sourceDomains}</strong><small>domäner · bredd {a.breadthScore}/100</small></td>)}</tr>
    <tr><td>Tyngsta tema</td>{data.comparison.actors.map(a=><td key={a.name}>{a.topCategory??'–'}</td>)}</tr>
    <tr><td>Tyngsta geografi</td>{data.comparison.actors.map(a=><td key={a.name}>{a.topGeography??'–'}</td>)}</tr>
  </tbody></table></div>
  <div className="compareGrid"><section><small className="sectionKicker">VAD SKILJER UT SIG?</small><div className="compareObservations">{data.comparison.observations.map((x,i)=><div key={x}><span>{i+1}</span><p>{x}</p></div>)}</div></section>
  <section><small className="sectionKicker">TEMAKARTA · 30 D VS FÖREGÅENDE 30 D</small><div className="themeCompareList">{data.comparison.themes.length?data.comparison.themes.map(t=><div key={t.theme} className="themeCompare"><div className="themeCompareTitle"><strong>{t.theme}</strong>{t.leader&&<span>{t.leader} leder observerat</span>}</div><div className="themeActorBars">{t.actors.map(a=>{const max=Math.max(...t.actors.map(x=>x.current30),1);return <div key={a.name}><small>{a.name}</small><div className="barTrack"><span style={{width:`${Math.max(4,Math.round(a.current30/max*100))}%`}}/></div><b>{a.current30}</b><em className={a.direction}>{directionLabel(a.direction)}</em></div>})}</div><p>{t.note}</p></div>):<p className="smallText">För lite underlag för en temajämförelse.</p>}</div></section></div>
  <div className="compareCaveat"><ShieldAlert size={16}/><div><strong>Så ska jämförelsen läsas</strong><p>{data.comparison.caveats.join(' ')}</p></div></div><p className="actorDisclaimer">{data.disclaimer}</p></div>}
  {!loading&&selected.length>=2&&data?.comparison===null&&data?.historyEnabled&&<div className="emptyState">Det finns ännu inte tillräckligt med daterad historik för de valda aktörerna.</div>}
  {loading&&<div className="emptyState">Jämför aktörerna… <ArrowRight size={14}/></div>}</>}
  </section>
}
