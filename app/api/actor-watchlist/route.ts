import { NextRequest, NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { buildActorWatchlist } from "@/lib/intelligence/actor-watchlist";
export const dynamic="force-dynamic";
function list(value:string|null){return(value??'').split(',').map(x=>x.trim()).filter(Boolean)}
export async function GET(req:NextRequest){
  const actors=list(req.nextUrl.searchParams.get('actors'));
  const history=await loadHistoricalEvents(90);
  return NextResponse.json({
    historyEnabled:history.enabled,reason:history.reason,eventCount:history.events.length,actors:history.enabled?buildActorWatchlist(history.events,actors):[],
    disclaimer:'Aktörsbilden bygger på observerade källhändelser. Bevakly skiljer på observerat mönster och verifierad strategi; frånvaro av träffar betyder inte frånvaro av aktivitet.'
  });
}
