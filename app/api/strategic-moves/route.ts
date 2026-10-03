import { NextRequest, NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { deriveStrategicMoves } from "@/lib/intelligence/strategic-moves";
export const dynamic="force-dynamic";
function list(value:string|null){return(value??'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,10)}
export async function GET(req:NextRequest){
  const actors=list(req.nextUrl.searchParams.get('actors'));
  const history=await loadHistoricalEvents(120);
  const moves=history.enabled?deriveStrategicMoves(history.events,actors):[];
  return NextResponse.json({historyEnabled:history.enabled,reason:history.reason,eventCount:history.events.length,moves,disclaimer:'Strategic Moves är hypoteser byggda av flera observerade signaler. De ska användas för att styra fortsatt bevakning – inte som verifierade påståenden om en aktörs strategi.'});
}
