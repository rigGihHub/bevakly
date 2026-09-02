import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { assessEvidence } from "@/lib/intelligence/evidence";
import { WASTE_THEMES } from "@/lib/intelligence/waste-taxonomy";

export type EmergingTopic = {
  id: string;
  label: string;
  eventCount: number;
  independentSources: number;
  confidence: "medel" | "låg";
  explanation: string;
  evidence: string[];
};

const STOP = new Set(["och","eller","att","som","för","med","till","från","den","det","de","en","ett","på","av","inom","ska","kan","har","mot","vid","efter","under","över","sverige","svensk","svenska","avfall","återvinning","nya","nytt","ökar","minskar","projekt","rapport"]);
const KNOWN = new Set(WASTE_THEMES.flatMap(t=>t.keywords).flatMap(k=>k.toLowerCase().replace(/[^a-z0-9åäö-]+/gi," ").split(/\s+/)).filter(x=>x.length>=5));
function tokens(title:string){ return title.toLowerCase().replace(/[^a-z0-9åäö-]+/gi," ").split(/\s+/).filter(x=>x.length>=5&&!STOP.has(x)&&!KNOWN.has(x)); }
function age(value:string|null,now:Date){if(!value)return Infinity;const ms=new Date(value).getTime();return Number.isNaN(ms)?Infinity:(now.getTime()-ms)/86400000;}

export function discoverEmergingTopics(events: HistoricalEvent[], now=new Date()): EmergingTopic[] {
  const recent=events.filter(e=>age(e.publishedAt,now)<45);
  const freq=new Map<string,HistoricalEvent[]>();
  for(const e of recent){
    for(const token of new Set(tokens(e.title))) freq.set(token,[...(freq.get(token)??[]),e]);
  }
  return [...freq.entries()].filter(([,rows])=>rows.length>=3).map(([token,rows])=>{
    const q=assessEvidence(rows);
    return {id:`emerging-${token}`,label:token.charAt(0).toUpperCase()+token.slice(1),eventCount:rows.length,independentSources:q.independentSources,confidence:q.independentSources>=2?"medel":"låg",explanation:`Begreppet återkommer i ${rows.length} händelser men finns inte som etablerat Bevakly-tema. ${q.note}`,evidence:rows.slice(0,4).map(e=>e.title)} as EmergingTopic;
  }).sort((a,b)=>b.independentSources-a.independentSources||b.eventCount-a.eventCount).slice(0,5);
}
