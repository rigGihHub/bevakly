import { NextRequest, NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { deriveWeakSignals } from "@/lib/intelligence/signals";
import { buildExecutiveBrief, deriveBlindSpots, deriveStrategicImpacts, deriveTrendIntelligence } from "@/lib/intelligence/strategic-intelligence";
import { deriveBeliefShifts } from "@/lib/intelligence/belief-shifts";
import { discoverEmergingTopics } from "@/lib/intelligence/topic-discovery";
import { findContradictions } from "@/lib/intelligence/contradictions";
import { getIndustryProfile } from "@/lib/intelligence/industries";
function list(value:string|undefined){return(value??"").split(",").map(x=>x.trim()).filter(Boolean)}
export async function GET(req:NextRequest){
 const industry=req.nextUrl.searchParams.get('industry')??'waste'; const custom=req.nextUrl.searchParams.get('custom')??''; const profile=getIndustryProfile(industry,custom); const history=await loadHistoricalEvents(180);
 const base={productBoundary:"Bevakly analyserar omvärld och marknadsförändringar. Själva upphandlings- och anbudsarbetet hör hemma i Anbudify."};
 if(!history.enabled||history.events.length===0)return NextResponse.json({...base,historyEnabled:history.enabled,reason:history.reason??"Ingen historik finns ännu.",eventCount:history.events.length,executiveBrief:[],impacts:[],trends:[],blindSpots:[],weakSignals:[],beliefShifts:[],emergingTopics:[],contradictions:[],intelligenceQuality:{independentSourceRule:true,taxonomy:industry==='waste'?'Avfall & återvinning v1':`${profile.label} · generell modell`,note:'Branschflödet är branschanpassat. Fördjupad taxonomi är ännu fullt utvecklad för Avfall & återvinning.'}});
 const impacts=deriveStrategicImpacts(history.events),trends=deriveTrendIntelligence(history.events),blindSpots=deriveBlindSpots(history.events,list(process.env.BEVAKLY_WATCH_TOPICS),list(process.env.BEVAKLY_WATCH_COMPETITORS)),weakSignals=deriveWeakSignals(history.events);
 const waste=industry==='waste'; const beliefShifts=waste?deriveBeliefShifts(history.events):[]; const emergingTopics=waste?discoverEmergingTopics(history.events):[]; const contradictions=findContradictions(history.events,industry); const executiveBrief=buildExecutiveBrief({impacts,trends,blindSpots,weakSignals});
 return NextResponse.json({...base,historyEnabled:true,reason:null,eventCount:history.events.length,executiveBrief,impacts,trends,blindSpots,weakSignals,beliefShifts,emergingTopics,contradictions,intelligenceQuality:{independentSourceRule:true,taxonomy:waste?'Avfall & återvinning v1':`${profile.label} · generell modell`,note:waste?'Flera träffar från samma domän räknas inte som flera oberoende bekräftelser.':'Branschflödet använder vald bransch. Strategisk historik använder tills vidare den generella kategorimodellen för denna bransch.'}});
}
