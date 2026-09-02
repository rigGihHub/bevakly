import { NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { deriveOpportunities } from "@/lib/intelligence/opportunities";
export const dynamic="force-dynamic";
export async function GET(){
  const history=await loadHistoricalEvents(120);
  return NextResponse.json({
    historyEnabled:history.enabled,
    reason:history.reason,
    eventCount:history.events.length,
    disclaimer:"Opportunity Radar hittar hypoteser att undersöka. Den verifierar inte marknadsstorlek, konkurrens eller lönsamhet.",
    opportunities:history.enabled?deriveOpportunities(history.events):[]
  });
}
