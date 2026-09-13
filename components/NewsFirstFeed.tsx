'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { WatchProfile } from '@/lib/intelligence/watch-profiles';

type NewsItem={title:string;url:string;source:string;publishedAt:string;category?:string;importance?:string;factualSummary?:string;competitors?:string[];score?:number;status?:string};
type IntakeDiagnostics={fixed?:{rawCandidates?:number;clustersConsidered?:number;articleReadAttempted?:number;articleReadFailed?:number;missingOrInvalidDate?:number;outsideSelectedPeriod?:number;acceptedInPeriod?:number};discovery?:{processedResults?:number;accepted?:number;rejected?:number;dedupeDropped?:number;rejectionReasons?:Record<string,number>}};
type SourceStatus={id:string;name:string;type:string;hits:number;ok:boolean;runHealth?:string};
type Payload={fetchedAt?:string;items?:NewsItem[];discoveryResults?:NewsItem[];newsIntakeDiagnostics?:IntakeDiagnostics;sourceStatus?:SourceStatus[];note?:string};

function fmtDate(value:string){try{return new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return value}}
function analysis(item:NewsItem){
  const c=(item.competitors??[]).join(', ');
  const cat=(item.category??'övrigt').toLocaleLowerCase('sv-SE');
  if(cat.includes('upphand')||cat.includes('kontrakt')||cat.includes('tilldel')) return `Möjlig affärssignal${c?` för ${c}`:''}. Kontrollera omfattning, värde och leverantörsförändring.`;
  if(cat.includes('tillstånd')||cat.includes('mynd')) return `Kan påverka kapacitet eller etablering${c?` för ${c}`:''}. Följ nästa beslut.`;
  if(cat.includes('kapacitet')||cat.includes('anlägg')||cat.includes('invest')) return `Möjlig kapacitets- eller investeringssignal${c?` för ${c}`:''}.`;
  if(cat.includes('jobb')||cat.includes('rekryt')) return `Kan signalera ökad aktivitet${c?` för ${c}`:''}, men kräver mer stöd.`;
  return `Relevant observation${c?` om ${c}`:''}.`;
}
function keyOf(item:NewsItem){return item.url.replace(/[?#].*$/,'').replace(/\/$/,'')}

export default function NewsFirstFeed({industry,customIndustry,profile,focus}:{industry:string;customIndustry?:string;profile:WatchProfile;focus:'industry'|'competitors'}){
  const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const load=async()=>{
    setLoading(true);setError(null);
    try{
      const qs=new URLSearchParams({industry,days:'7',refresh:Date.now().toString()});
      if(customIndustry)qs.set('custom',customIndustry);
      if(profile.actors.length)qs.set('actors',profile.actors.join('|'));
      const r=await fetch(`/api/industry-feed?${qs}`,{cache:'no-store'});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const payload=await r.json() as Payload;
      setData(payload);
      window.dispatchEvent(new CustomEvent('bevakly:refresh-done',{detail:{fetchedAt:payload.fetchedAt}}));
    }catch(e){setError(e instanceof Error?e.message:'Kunde inte hämta nyheter');window.dispatchEvent(new CustomEvent('bevakly:refresh-error'))}
    finally{setLoading(false)}
  };
  useEffect(()=>{void load()},[industry,customIndustry,profile.id,profile.actors.join('|')]);
  useEffect(()=>{const h=()=>void load();window.addEventListener('bevakly:refresh-all',h);return()=>window.removeEventListener('bevakly:refresh-all',h)},[industry,customIndustry,profile.id,profile.actors.join('|')]);

  const all=useMemo(()=>{
    const m=new Map<string,NewsItem>();
    for(const item of [...(data?.items??[]),...(data?.discoveryResults??[])]){if(item?.url&&!m.has(keyOf(item)))m.set(keyOf(item),item)}
    return [...m.values()].sort((a,b)=>new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime());
  },[data]);
  const competitor=all.filter(x=>(x.competitors??[]).some(c=>profile.actors.some(a=>a.toLocaleLowerCase('sv-SE')===c.toLocaleLowerCase('sv-SE'))));
  const industryNews=all.filter(x=>!competitor.includes(x));
  const diag=data?.newsIntakeDiagnostics;
  const raw=diag?.fixed?.rawCandidates??0,clusters=diag?.fixed?.clustersConsidered??0;
  const totalAccepted=all.length;
  const sourcePressure=useMemo(()=>[...(data?.sourceStatus??[])].filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits).slice(0,8),[data?.sourceStatus]);
  const label=focus==='competitors'?'Konkurrenter':'Branschen';
  const items=focus==='competitors'?competitor:industryNews;

  return <section id="industry-feed" style={{display:'grid',gap:10}}>
    {loading&&<div style={{fontSize:13,color:'var(--muted,#5f6b66)'}}>Hämtar…</div>}
    {error&&<div style={{border:'1px solid #c96',padding:12,borderRadius:10}}><strong>Hämtningen misslyckades.</strong> {error}</div>}
    {!loading&&totalAccepted===0&&<div style={{border:'1px solid #d8b36a',background:'#fffaf0',padding:12,borderRadius:12}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}><AlertTriangle size={18}/><strong>Inga nyheter hittades</strong></div>
      <p style={{margin:'6px 0 0',fontSize:13,color:'#5f6b66'}}>{raw} kandidater → {clusters} granskade.</p>
    </div>}

    <section id={focus==='competitors'?'actors':undefined} style={{border:'1px solid var(--border,#dfe5e1)',borderRadius:14,padding:'12px 14px',background:'white'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}><h3 style={{margin:0,fontSize:18}}>{label}</h3><strong>{items.length}</strong></div>
      {items.length===0?<p style={{color:'var(--muted,#5f6b66)',margin:'10px 0 2px'}}>Inget nytt senaste 7 dagarna.</p>:<div style={{display:'grid',gap:0,marginTop:6}}>{items.slice(0,focus==='competitors'?10:12).map(item=><article key={keyOf(item)} style={{borderTop:'1px solid #edf0ee',padding:'10px 0'}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',fontSize:11,color:'var(--muted,#5f6b66)'}}><span>{fmtDate(item.publishedAt)}</span><span>· {item.source}</span>{item.category&&<span>· {item.category}</span>}</div>
        <h4 style={{margin:'4px 0 5px',fontSize:16,lineHeight:1.28}}>{item.title}</h4>
        {item.factualSummary&&<p style={{margin:'0 0 5px',fontSize:13,lineHeight:1.4}}>{item.factualSummary}</p>}
        <p style={{margin:'0 0 6px',fontSize:13,lineHeight:1.4,color:'#33413b'}}><strong>Analys:</strong> {analysis(item)}</p>
        <a href={item.url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700}}>Original <ExternalLink size={12}/></a>
      </article>)}</div>}
    </section>

    <details style={{border:'1px solid var(--border,#dfe5e1)',borderRadius:10,padding:'9px 11px',fontSize:12}}><summary><strong>Diagnostik</strong></summary><div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}><span>{raw} kandidater</span><span>→ {clusters} kluster</span><span>→ {diag?.fixed?.articleReadAttempted??0} lästa</span><span>→ {totalAccepted} nyheter</span></div>{sourcePressure.length>0&&<div style={{marginTop:8}}><strong>Källor:</strong> {sourcePressure.slice(0,5).map(x=>`${x.name} ${x.hits}`).join(' · ')}</div>}{diag?.discovery?.rejectionReasons&&<div style={{marginTop:8}}><strong>Avslag:</strong> {Object.entries(diag.discovery.rejectionReasons).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k} ${v}`).join(' · ')}</div>}</details>
  </section>
}
