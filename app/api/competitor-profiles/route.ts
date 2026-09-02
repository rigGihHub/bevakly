import { NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { buildCompetitorProfiles } from "@/lib/intelligence/competitor-profile";
export const dynamic = "force-dynamic";
export async function GET(){
  const history=await loadHistoricalEvents(120);
  return NextResponse.json({historyEnabled:history.enabled,reason:history.reason,eventCount:history.events.length,profiles:history.enabled?buildCompetitorProfiles(history.events):[]});
}
