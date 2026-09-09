"use client";
import { useState } from "react";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { answerAskBevakly, type AskTimeline, type AskFollowed, type AskAnswer } from "@/lib/intelligence/ask-bevakly";

export default function AskBevakly({timelines,followed}:{timelines:AskTimeline[];followed:AskFollowed[]}){
 const [question,setQuestion]=useState("");
 const [answer,setAnswer]=useState<AskAnswer|null>(null);
 const ask=(q=question)=>{const clean=q.trim();if(!clean)return;setQuestion(clean);setAnswer(answerAskBevakly(clean,timelines,followed));};
 const examples=["Vad har Ragn-Sells gjort senaste tiden?","Vilken konkurrent visar starkast expansionssignaler?","Vilka förändringar vi följer försvagas?"];
 return <section className="askBevakly"><div className="askBevaklyHead"><div><p className="eyebrow"><Sparkles size={14}/> ASK BEVAKLY</p><h3>Fråga Bevakly om vad som håller på att hända</h3><p>Svaren byggs från Bevaklys egna aktuella signaler och beviskedjor. Saknas stöd säger Bevakly det.</p></div></div>
 <div className="askBox"><div className="askInput"><Search size={17}/><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")ask()}} placeholder="Exempel: Vilken konkurrent visar starkast expansionssignaler?"/><button onClick={()=>ask()}>Fråga</button></div><div className="askExamples">{examples.map(x=><button key={x} onClick={()=>ask(x)}>{x}</button>)}</div></div>
 {answer&&<div className="askAnswer"><div className="askAnswerLead"><span>BEVAKLY SVARAR</span><strong>{answer.answer}</strong></div>{answer.bullets.length>0&&<div className="askBullets">{answer.bullets.map((x,i)=><p key={i}>{x}</p>)}</div>}{answer.evidence.length>0&&<details><summary>Visa källunderlag ({answer.evidence.length})</summary><div className="askEvidence">{answer.evidence.map((x,i)=><a key={`${x.url}-${i}`} href={x.url} target="_blank" rel="noreferrer"><span><strong>{x.title}</strong><small>{x.source} · {new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(x.publishedAt))}</small></span><ExternalLink size={12}/></a>)}</div></details>}<div className="askLimits">{answer.limitations.map((x,i)=><small key={i}>{x}</small>)}</div></div>}
 </section>;
}
