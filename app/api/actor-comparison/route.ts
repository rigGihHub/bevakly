import { NextRequest, NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { buildActorComparison } from "@/lib/intelligence/actor-comparison";
export const dynamic="force-dynamic";
function list(value:string|null){return(value??'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,6)}
export async function GET(req:NextRequest){
  const actors=list(req.nextUrl.searchParams.get('actors'));
  const history=await loadHistoricalEvents(90);
  return NextResponse.json({
    historyEnabled:history.enabled,reason:history.reason,eventCount:history.events.length,
    comparison:history.enabled&&actors.length>=2?buildActorComparison(history.events,actors):null,
    disclaimer:'Jämförelsen visar observerad källaktivitet. Den är inte en marknadsandel, prestationsmätning eller verifierad bild av en aktörs fullständiga strategi.'
  });
}
