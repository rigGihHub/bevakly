import { NextResponse } from "next/server";
import { loadHistoricalEvents } from "@/lib/server/history";
import { deriveWeakSignals } from "@/lib/intelligence/signals";
export const dynamic = "force-dynamic";
export async function GET(){
  const history=await loadHistoricalEvents(120);
  return NextResponse.json({historyEnabled:history.enabled,reason:history.reason,eventCount:history.events.length,disclaimer:"Svaga signaler är hypoteser baserade på mönster, inte verifierade framtida händelser.",signals:history.enabled?deriveWeakSignals(history.events):[]});
}
