import { NextResponse } from "next/server";
import { deriveStrategicSignals } from "@/lib/intelligence/signals";
import { loadHistoricalEvents, persistStrategicSignals } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET() {
  const history = await loadHistoricalEvents(120);
  const signals = deriveStrategicSignals(history.events);
  const persistence = history.enabled ? await persistStrategicSignals(signals) : {enabled:false,saved:0};
  return NextResponse.json({
    mode: "strategic-signals-v0.6",
    generatedAt: new Date().toISOString(),
    historyEnabled: history.enabled,
    historyEventCount: history.events.length,
    reason: history.reason,
    persistence,
    disclaimer: "Strategiska signaler är maskinellt identifierade mönster. De är hypoteser, inte verifierad fakta.",
    signals,
  });
}
