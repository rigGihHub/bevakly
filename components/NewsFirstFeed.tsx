'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import type { WatchProfile } from '@/lib/intelligence/watch-profiles';

type NewsItem={title:string;url:string;source:string;publishedAt:string;category?:string;importance?:string;factualSummary?:string;competitors?:string[];score?:number;status?:string};
type IntakeDiagnostics={fixed?:{rawCandidates?:number;clustersConsidered?:number;articleReadAttempted?:number;articleReadFailed?:number;missingOrInvalidDate?:number;outsideSelectedPeriod?:number;acceptedInPeriod?:number};discovery?:{processedResults?:number;accepted?:number;rejected?:number;dedupeDropped?:number;rejectionReasons?:Record<string,number>}};
type SourceStatus={id:string;name:string;type:string;hits:number;ok:boolean;runHealth?:string};
type Payload={fetchedAt?:string;items?:NewsItem[];discoveryResults?:NewsItem[];newsIntakeDiagnostics?:IntakeDiagnostics;sourceStatus?:SourceStatus[];note?:string};

function fmtDate(value:string){try{return new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return value}}
function analysis(item:NewsItem){
  const c=(item.competitors??[]).join(', ');
  const cat=(item.category??'övrigt').toLocaleLowerCase('sv-SE');
  if(cat.includes('upphand')||cat.includes('kontrakt')||cat.includes('tilldel')) return `Bedömning: möjlig affärssignal${c?` för ${c}`:''}. Kontrollera omfattning, avtalsperiod, värde och eventuell leverantörsförändring i originalkällan.`;
  if(cat.includes('tillstånd')||cat.includes('mynd')) return `Bedömning: formell process som kan påverka kapacitet eller etablering${c?` för ${c}`:''}. Följ nästa myndighetsbeslut innan starkare slutsats dras.`;
  if(cat.includes('kapacitet')||cat.includes('anlägg')||cat.includes('invest')) return `Bedömning: kan vara en kapacitets- eller investeringssignal${c?` för ${c}`:''}. En enskild publicering bevisar inte genomförande.`;
  if(cat.includes('jobb')||cat.includes('rekryt')) return `Bedömning: rekrytering kan vara en tidig aktivitetssignal${c?` för ${c}`:''}, men är svag evidens utan stöd från andra källor.`;
  return `Bedömning: relevant observation${c?` kopplad till ${c}`:''}. Betydelsen behöver värderas mot fler källor och fortsatt utveckling.`;
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
  const raw=diag?.fixed?.rawCandidates??0,clusters=diag?.fixed?.clustersConsidered??0,accepted=diag?.fixed?.acceptedInPeriod??(data?.items?.length??0),discoveryAccepted=diag?.discovery?.accepted??(data?.discoveryResults?.length??0);
  const totalAccepted=all.length;
  const preReviewReduction=Math.max(0,raw-clusters);
  const sourcePressure=useMemo(()=>[...(data?.sourceStatus??[])].filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits).slice(0,8),[data?.sourceStatus]);
  const typePressure=useMemo(()=>{
    const totals=new Map<string,number>();
    for(const source of data?.sourceStatus??[])totals.set(source.type,(totals.get(source.type)??0)+source.hits);
    return [...totals.entries()].filter(([,hits])=>hits>0).sort((a,b)=>b[1]-a[1]);
  },[data?.sourceStatus]);
  const ordered=focus==='competitors'?[['Konkurrenter',competitor],['Branschen',industryNews]] as const:[['Branschen',industryNews],['Konkurrenter',competitor]] as const;

  return <section id="industry-feed" style={{display:'grid',gap:16}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:12,flexWrap:'wrap'}}>
      <div><p className="eyebrow">SENASTE NYTT</p><h2 style={{margin:'4px 0'}}>Nyheter först</h2><p style={{margin:0,color:'var(--muted,#5f6b66)'}}>Branschnyheter och konkurrentnyheter från den senaste sjudagarsperioden.</p></div>
      <button className="globalRefreshButton" onClick={()=>void load()} disabled={loading}><RefreshCw size={16} className={loading?'spin':''}/><span><strong>{loading?'Hämtar…':'Uppdatera nu'}</strong><small>{data?.fetchedAt?`Senast ${fmtDate(data.fetchedAt)}`:'Färsk hämtning'}</small></span></button>
    </div>

    {error&&<div style={{border:'1px solid #c96',padding:14,borderRadius:12}}><strong>Kunde inte hämta nyheter.</strong> {error}</div>}
    {!loading&&totalAccepted===0&&<div style={{border:'1px solid #d8b36a',background:'#fffaf0',padding:16,borderRadius:14}}>
      <div style={{display:'flex',gap:10,alignItems:'center'}}><AlertTriangle size={20}/><strong>Inga publicerade nyheter trots kandidatflöde</strong></div>
      <p style={{margin:'8px 0 12px'}}>Det här ska behandlas som ett intake-problem, inte döljas bakom analyskort.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{raw} råa kandidater</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{clusters} kluster granskade</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{preReviewReduction} reducerade före full artikelgranskning</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{diag?.fixed?.articleReadFailed??0} läsfel</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{diag?.fixed?.missingOrInvalidDate??0} saknar datum</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{diag?.fixed?.outsideSelectedPeriod??0} utanför 7 dagar</span>
        <span style={{padding:'6px 9px',border:'1px solid #ddd',borderRadius:9}}>{accepted+discoveryAccepted} accepterade före visningsdedupe</span>
      </div>
      <p style={{margin:'10px 0 0',fontSize:13,color:'#5f6b66'}}>”Reducerade före full artikelgranskning” kombinerar deduplicering och intake-taket och ska därför inte tolkas som rena kvalitetsavslag.</p>
      {sourcePressure.length>0&&<details style={{marginTop:12}} open><summary><strong>Vilka källor fyller intake-kön?</strong></summary><div style={{marginTop:8,display:'grid',gap:6}}>{sourcePressure.map(source=><div key={source.id} style={{display:'flex',justifyContent:'space-between',gap:12,borderTop:'1px solid #eadfc9',paddingTop:6}}><span>{source.name} <small style={{color:'#6b746f'}}>({source.type})</small></span><strong>{source.hits}</strong></div>)}</div>{typePressure.length>0&&<div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>{typePressure.map(([type,hits])=><span key={type} style={{padding:'5px 8px',border:'1px solid #ddd',borderRadius:8}}>{type}: {hits}</span>)}</div>}</details>}
      {diag?.discovery?.rejectionReasons&&<details style={{marginTop:12}}><summary>Visa discovery-avslag</summary><div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>{Object.entries(diag.discovery.rejectionReasons).sort((a,b)=>b[1]-a[1]).map(([k,v])=><span key={k} style={{padding:'5px 8px',border:'1px solid #ddd',borderRadius:8}}>{k}: {v}</span>)}</div></details>}
    </div>}

    {ordered.map(([label,items])=><section key={label} id={label==='Konkurrenter'?'actors':undefined} style={{border:'1px solid var(--border,#dfe5e1)',borderRadius:16,padding:16,background:'white'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}><div><p className="eyebrow">{label.toUpperCase()}</p><h3 style={{margin:'3px 0'}}>{label==='Konkurrenter'?'Senaste konkurrentnyheterna':'Senaste branschnyheterna'}</h3></div><strong>{items.length}</strong></div>
      {items.length===0?<p style={{color:'var(--muted,#5f6b66)'}}>Inga verifierade nyheter i perioden.</p>:<div style={{display:'grid',gap:10,marginTop:10}}>{items.slice(0,label==='Konkurrenter'?10:12).map(item=><article key={keyOf(item)} style={{borderTop:'1px solid #edf0ee',paddingTop:12}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',fontSize:12,color:'var(--muted,#5f6b66)'}}><span>{fmtDate(item.publishedAt)}</span><span>· {item.source}</span>{item.category&&<span>· {item.category}</span>}{item.competitors?.length?<span>· {item.competitors.join(', ')}</span>:null}</div>
        <h4 style={{margin:'5px 0 6px',fontSize:17}}>{item.title}</h4>
        {item.factualSummary&&<p style={{margin:'0 0 7px'}}><strong>Fakta:</strong> {item.factualSummary}</p>}
        <p style={{margin:'0 0 8px',color:'#33413b'}}><strong>Bevaklys analys:</strong> {analysis(item)}</p>
        <a href={item.url} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:5,fontWeight:700}}>Läs original <ExternalLink size={14}/></a>
      </article>)}</div>}
    </section>)}

    {totalAccepted>0&&<details style={{border:'1px solid var(--border,#dfe5e1)',borderRadius:12,padding:12}}><summary><strong>Intake-diagnostik</strong> – varför vissa kandidater sorterades bort</summary><div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}><span>{raw} råa kandidater</span><span>→ {clusters} kluster</span><span>→ {diag?.fixed?.articleReadAttempted??0} artiklar lästa</span><span>→ {totalAccepted} visade nyheter</span></div>{preReviewReduction>0&&<p style={{margin:'9px 0 0',fontSize:13,color:'#5f6b66'}}>{preReviewReduction} kandidater försvann i steget dedupe + intake-budget före full artikelgranskning. Det är en kapacitets-/urvalsindikator, inte ett bevis på låg nyhetskvalitet.</p>}{sourcePressure.length>0&&<div style={{marginTop:10}}><strong>Största kandidatproducenter:</strong> {sourcePressure.slice(0,5).map(x=>`${x.name} ${x.hits}`).join(' · ')}</div>}</details>}
  </section>
}
