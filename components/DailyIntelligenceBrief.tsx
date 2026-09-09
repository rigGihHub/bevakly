"use client";
import { Activity, ArrowRight, CalendarDays, Eye, Radar, TrendingUp } from "lucide-react";
import { buildDailyIntelligenceBrief, type DailyTimeline, type DailyFollowed } from "@/lib/intelligence/daily-intelligence-brief";

function direction(x:string){return x==="escalating"?"Stärks":x==="cooling"?"Kyls ned":"Stabil";}
export default function DailyIntelligenceBrief({timelines,followed}:{timelines:DailyTimeline[];followed:DailyFollowed[]}){
 const brief=buildDailyIntelligenceBrief(timelines,followed);
 return <section className="dailyIntel">
  <div className="dailyIntelHead"><div><p className="eyebrow"><CalendarDays size={14}/> BEVAKLY DAILY</p><h3>Det här behöver du känna till idag</h3><p>En kort beslutsbrief. Förändringar före nyhetsvolym, med tydlig skillnad mellan observerade signaler och Bevaklys prioritering.</p></div><span>{new Intl.DateTimeFormat("sv-SE",{day:"numeric",month:"short"}).format(new Date(brief.generatedAt))}</span></div>
  {brief.empty?<div className="analystEmpty"><strong>Ingen robust förändringssignal att lyfta idag.</strong><span>Bevakly fyller inte briefen med svaga slutsatser bara för att skapa innehåll.</span></div>:<>
   <div className="dailyIntelGrid">
    <div className="dailyIntelMain"><div className="dailyBlockTitle"><Radar size={15}/><strong>3 förändringar</strong></div>{brief.changes.map((x,i)=><article key={x.id}><b>{i+1}</b><div><h4>{x.headline}</h4><small>{direction(x.direction)} · {x.escalationScore}/100 · {x.facts} fakta · {x.sourceClasses.length} källtyper</small></div></article>)}</div>
    <aside><div className="dailyMetric"><TrendingUp size={16}/><div><strong>{brief.strengthened.length}</strong><span>signaler som stärks</span></div></div><div className="dailyMetric"><Eye size={16}/><div><strong>{brief.competitor?.name??"–"}</strong><span>konkurrent att bevaka extra</span></div></div></aside>
   </div>
   <div className="dailyWatch"><div><div className="dailyBlockTitle"><Activity size={15}/><strong>Bevaka idag</strong></div>{brief.watchToday.length?brief.watchToday.map(x=><p key={x}><ArrowRight size={12}/>{x}</p>):<p>Ingen specifik nästa kontroll har tillräckligt stöd.</p>}</div>{brief.followedAttention.length>0&&<div><div className="dailyBlockTitle"><Eye size={15}/><strong>Följda historier som kräver blick</strong></div>{brief.followedAttention.map(x=><p key={x.headline}><ArrowRight size={12}/>{x.headline} · {x.status==="strengthening"?"stärks":x.status==="weakening"?"försvagas":"saknar ny träff"}</p>)}</div>}</div>
   <small className="storyClusterNote">Prioriteringen bygger på aktuell Signal Timeline och browserlokalt följda förändringar. Score visar beviskedjans styrka, inte sannolikhet.</small>
  </>}
 </section>
}
