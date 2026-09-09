"use client";
import { ArrowRight, History, TrendingDown, TrendingUp } from "lucide-react";

type Step={observedAt:string;score:number;scoreDelta:number|null;facts:number;factsDelta:number|null;stage:string;direction:string;addedSourceClasses:string[];changes:string[]};
export type CaseEvolution={caseKey:string;headline:string;competitors:string[];geographies:string[];firstObservedAt:string;lastObservedAt:string;observations:number;firstScore:number;latestScore:number;scoreDelta:number;firstStage:string;latestStage:string;trend:'strengthening'|'weakening'|'mixed'|'stable';steps:Step[];explanation:string[];canCompare:boolean};

function stageLabel(x:string){return x==='execution'?'Genomförande':x==='decision-or-award'?'Beslut/tilldelning':x==='formal-process'?'Formell process':x==='corroborating'?'Bekräftas':'Första signal';}
function trendLabel(x:CaseEvolution['trend']){return x==='strengthening'?'Stärks över tid':x==='weakening'?'Försvagas över tid':x==='mixed'?'Blandad utveckling':'Stabil';}

export default function CaseEvolutionPanel({items,historySource}:{items:CaseEvolution[];historySource:'database'|'current-run'}){
 if(!items.length)return null;
 return <section className="caseEvolution">
  <div className="caseEvolutionHead"><div><p className="eyebrow"><History size={14}/> CASE EVOLUTION</p><h3>Hur har förändringarna utvecklats?</h3><p>Bevakly visar vad som faktiskt ändrat bedömningen: score, fakta, process-steg, riktning och nya källtyper.</p></div><span>{historySource==='database'?'Historik från databasen':'Endast aktuell körning'}</span></div>
  <div className="caseEvolutionList">{items.map((item,i)=><details key={item.caseKey} open={i===0}>
   <summary><div><span className={`caseTrend trend-${item.trend}`}>{item.trend==='strengthening'?<TrendingUp size={12}/>:item.trend==='weakening'?<TrendingDown size={12}/>:<History size={12}/>} {trendLabel(item.trend)}</span><h4>{item.headline}</h4><small>{item.canCompare?`${item.firstScore} → ${item.latestScore} (${item.scoreDelta>=0?'+':''}${item.scoreDelta}) · ${item.observations} observationer`:'Första sparade observationen · ännu ingen utvecklingsjämförelse'}</small></div><ArrowRight size={16}/></summary>
   <div className="caseEvolutionBody">
    <div className="caseEvolutionSummary">{item.explanation.map((x,idx)=><p key={idx}>{x}</p>)}</div>
    <div className="caseEvolutionSteps">{item.steps.map((s,idx)=><div key={`${s.observedAt}-${idx}`} className="caseEvolutionStep"><time>{new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(s.observedAt))}</time><div><strong>{s.score}/100 · {stageLabel(s.stage)}</strong><small>{s.facts} fakta · {s.direction==='escalating'?'stärks':s.direction==='cooling'?'kyls ned':'stabil'}</small>{s.changes.map((c,ci)=><span key={ci}>{c}</span>)}</div></div>)}</div>
   </div>
  </details>)}</div>
  <small className="storyClusterNote">{historySource==='database'?'Utvecklingen bygger på sparade case-snapshots.':'Persistent case history är inte aktiv. Därför kan Bevakly ännu inte visa verklig utveckling mellan körningar, bara den aktuella observationen.'}</small>
 </section>
}
