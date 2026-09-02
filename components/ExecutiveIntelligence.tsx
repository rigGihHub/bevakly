"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Binoculars, BrainCircuit, EyeOff, Lightbulb, RefreshCw, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

type Confidence = "hög" | "medel" | "låg";
type Brief = {id:string;priority:number;type:string;title:string;takeaway:string;whyNow:string;action:string;confidence:Confidence;score:number};
type Impact = {id:string;title:string;whatChanged:string;whyItMatters:string;watchNext:string[];confidence:Confidence;score:number;evidence:string[]};
type Trend = {id:string;label:string;direction:"accelererar"|"stabil"|"avtar"|"ny";recentCount:number;priorCount:number;changePct:number|null;geographies:string[];competitors:string[];explanation:string};
type Blind = {id:string;title:string;observation:string;whyItMayMatter:string;nextCheck:string;confidence:Confidence;score:number};
type BeliefShift = {id:string;theme:string;change:"stärkt"|"försvagad"|"ny bedömning";title:string;previousView:string;currentView:string;whyChanged:string;confidence:Confidence;recentCount:number;priorCount:number;independentSources:number;evidence:string[]};
type Emerging = {id:string;label:string;eventCount:number;independentSources:number;confidence:"medel"|"låg";explanation:string;evidence:string[]};
type Contradiction={id:string;theme:string;title:string;supporting:string[];counter:string[];interpretation:string;confidence:"medel"|"låg"};
type Payload = {historyEnabled:boolean;reason:string|null;eventCount:number;executiveBrief:Brief[];impacts:Impact[];trends:Trend[];blindSpots:Blind[];beliefShifts:BeliefShift[];emergingTopics:Emerging[];contradictions:Contradiction[];intelligenceQuality:{independentSourceRule:boolean;taxonomy:string;note:string};productBoundary:string};

export default function ExecutiveIntelligence({industry="waste",customIndustry=""}:{industry?:string;customIndustry?:string}){
  const [data,setData]=useState<Payload|null>(null);
  const [loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);try{const qs=new URLSearchParams({industry});if(customIndustry)qs.set("custom",customIndustry);const r=await fetch(`/api/executive-intelligence?${qs}`,{cache:"no-store"});setData(await r.json())}finally{setLoading(false)}};
  useEffect(()=>{load()},[industry,customIndustry]);

  return <section className="executiveIntelligence">
    <div className="intelHeroHeader">
      <div><p className="eyebrow"><Sparkles size={14}/> BEVAKLY INTELLIGENCE</p><h2>Vad behöver du förstå – och vad har förändrats?</h2><p>Bevakly väger ihop händelser, branschteman, källoberoende bekräftelse, trender och svaga signaler till ett kort beslutsunderlag.</p></div>
      <button onClick={load} disabled={loading}><RefreshCw size={15} className={loading?"spin":""}/> Uppdatera</button>
    </div>

    {data?.intelligenceQuality && <div className="qualityBar"><BrainCircuit size={16}/><div><strong>Intelligence quality</strong><span>{data.intelligenceQuality.taxonomy} · {data.intelligenceQuality.note}</span></div></div>}

    {!data || data.executiveBrief.length===0 ? <div className="intelEmpty"><AlertTriangle size={18}/><div><strong>Ingen sammanvägd intelligence ännu</strong><span>{data?.reason ?? "Historiken laddas."}</span><small>När Bevakly har tillräcklig historik visas högst fem saker som faktiskt förtjänar uppmärksamhet.</small></div></div> : <>
      <div className="briefGrid">{data.executiveBrief.map(item=><article className="briefCard" key={item.id}>
        <div className="briefTop"><span>#{item.priority}</span><strong>{item.score}/100</strong></div>
        <p className="briefType">{item.type.replace("blind-spot","blind spot").replace("weak-signal","svag signal")}</p>
        <h3>{item.title}</h3><p>{item.takeaway}</p>
        <div className="briefWhy"><strong>Varför nu</strong><span>{item.whyNow}</span></div>
        <div className="briefAction"><strong>Bevaka härnäst</strong><span>{item.action}</span></div>
        <footer>Säkerhet: {item.confidence} · samband markeras som hypotes där källorna inte verifierar dem</footer>
      </article>)}</div>

      {data.beliefShifts?.length>0 && <section className="beliefPanel">
        <div className="subTitle"><BrainCircuit size={18}/><div><p className="eyebrow">BELIEF SHIFTS</p><h3>Vad ändrade Bevakly uppfattning om?</h3></div></div>
        <p className="smallText">Visar bara teman där den nya 30-dagarsperioden faktiskt förändrar tidigare bedömning.</p>
        <div className="beliefGrid">{data.beliefShifts.slice(0,4).map(x=><article key={x.id} className={`beliefCard ${x.change.replace(" ","-")}`}>
          <div className="beliefHead"><span>{x.change}</span><b>Säkerhet {x.confidence}</b></div>
          <h4>{x.theme}</h4>
          <div className="beliefCompare"><div><strong>Tidigare</strong><span>{x.previousView}</span></div><div><strong>Nu</strong><span>{x.currentView}</span></div></div>
          <p>{x.whyChanged}</p><small>{x.independentSources} oberoende källdomän{x.independentSources===1?"":"er"}</small>
        </article>)}</div>
      </section>}

      <div className="intelligenceDetails">
        <section className="intelSubpanel"><div className="subTitle"><Binoculars size={17}/><div><p className="eyebrow">STRATEGIC IMPACT</p><h3>Vad förändras för marknaden?</h3></div></div>
          <div className="compactList">{data.impacts.slice(0,4).map(x=><article key={x.id}><div><strong>{x.title}</strong><span>{x.whatChanged}</span><small>Säkerhet: {x.confidence}</small></div><b>{x.score}</b></article>)}</div>
        </section>
        <section className="intelSubpanel"><div className="subTitle"><TrendingUp size={17}/><div><p className="eyebrow">TREND INTELLIGENCE</p><h3>Vad accelererar eller bromsar?</h3></div></div>
          <div className="compactList">{data.trends.slice(0,6).map(x=><article key={x.id}><div><strong>{x.label}</strong><span>{x.recentCount} senaste 30 d · {x.priorCount} föregående 30 d</span></div><b className={`trendDir ${x.direction}`}>{x.direction==="avtar"?<TrendingDown size={13}/>:<TrendingUp size={13}/>} {x.direction}</b></article>)}</div>
        </section>
        <section className="intelSubpanel blind"><div className="subTitle"><EyeOff size={17}/><div><p className="eyebrow">BLIND SPOTS</p><h3>Vad riskerar ni att missa?</h3></div></div>
          {data.blindSpots.length===0?<p className="smallText">Inga tydliga blinda fläckar kan beläggas med nuvarande data.</p>:<div className="compactList">{data.blindSpots.slice(0,4).map(x=><article key={x.id}><div><strong>{x.title}</strong><span>{x.observation}</span><small>{x.nextCheck}</small></div><b>{x.score}</b></article>)}</div>}
        </section>
      </div>

      {data.contradictions?.length>0 && <section className="contradictionPanel"><div className="subTitle"><AlertTriangle size={17}/><div><p className="eyebrow">CONTRADICTION ENGINE</p><h3>Vad talar emot Bevaklys nuvarande bild?</h3></div></div><div className="contradictionGrid">{data.contradictions.map(x=><article key={x.id}><div className="contradictionHead"><strong>{x.theme}</strong><span>Säkerhet {x.confidence}</span></div><h4>{x.title}</h4><div className="forAgainst"><div><b>Stärker bilden</b>{x.supporting.map(y=><span key={y}>+ {y}</span>)}</div><div><b>Talar emot</b>{x.counter.map(y=><span key={y}>− {y}</span>)}</div></div><p>{x.interpretation}</p></article>)}</div></section>}

      <section className="emergingPanel"><div className="subTitle"><Lightbulb size={17}/><div><p className="eyebrow">AUTOMATISK TEMATUPPTÄCKT</p><h3>Begrepp utanför Bevaklys nuvarande karta</h3></div></div>
        {!data.emergingTopics?.length?<p className="smallText">Inget nytt återkommande tema utanför den nuvarande avfalls-taxonomin kan beläggas ännu.</p>:<div className="emergingTags">{data.emergingTopics.map(x=><article key={x.id}><strong>{x.label}</strong><span>{x.eventCount} händelser · {x.independentSources} källor</span><small>{x.explanation}</small></article>)}</div>}
      </section>
    </>}
    <div className="productBoundary"><strong>Produktgräns:</strong> {data?.productBoundary ?? "Bevakly analyserar omvärlden; Anbudify hanterar upphandlings- och anbudsarbetet."}</div>
  </section>
}
