import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { assessEvidence } from "@/lib/intelligence/evidence";
import { eventsByTheme, WASTE_THEMES } from "@/lib/intelligence/waste-taxonomy";

export type BeliefShift = {
  id: string;
  theme: string;
  change: "stärkt" | "försvagad" | "ny bedömning";
  title: string;
  previousView: string;
  currentView: string;
  whyChanged: string;
  confidence: "hög" | "medel" | "låg";
  recentCount: number;
  priorCount: number;
  independentSources: number;
  evidence: string[];
};

function ageDays(value: string | null, now: Date) {
  if (!value) return Infinity;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? Infinity : (now.getTime() - ms) / 86400000;
}

export function deriveBeliefShifts(events: HistoricalEvent[], now = new Date()): BeliefShift[] {
  const byTheme = eventsByTheme(events);
  const out: BeliefShift[] = [];
  for (const theme of WASTE_THEMES) {
    const rows = byTheme.get(theme.id) ?? [];
    const recent = rows.filter(e => ageDays(e.publishedAt, now) < 30);
    const prior = rows.filter(e => ageDays(e.publishedAt, now) >= 30 && ageDays(e.publishedAt, now) < 60);
    if (recent.length < 2 && prior.length < 2) continue;
    const evidence = assessEvidence(recent);
    let change: BeliefShift["change"] | null = null;
    if (prior.length === 0 && recent.length >= 2) change = "ny bedömning";
    else if (recent.length >= Math.max(2, prior.length * 1.5)) change = "stärkt";
    else if (prior.length >= 2 && recent.length <= prior.length * 0.5) change = "försvagad";
    if (!change) continue;

    const previousView = prior.length === 0
      ? `Inget tydligt återkommande mönster inom ${theme.label} under föregående 30-dagarsperiod.`
      : `${prior.length} relevanta händelser inom ${theme.label} under föregående 30 dagar.`;
    const currentView = `${recent.length} relevanta händelser under senaste 30 dagar; källbekräftelse: ${evidence.confirmation}.`;
    const sourcePenalty = evidence.independentSources >= 3 ? 0 : evidence.independentSources === 2 ? 1 : 2;
    const confidence: BeliefShift["confidence"] = recent.length >= 5 && sourcePenalty === 0 ? "hög" : recent.length >= 3 && sourcePenalty <= 1 ? "medel" : "låg";

    out.push({
      id:`belief-${theme.id}`,
      theme:theme.label,
      change,
      title: change === "stärkt" ? `Bevakly har stärkt bedömningen om ${theme.label}` : change === "försvagad" ? `Bevakly har försvagat bedömningen om ${theme.label}` : `Bevakly ser ett nytt mönster inom ${theme.label}`,
      previousView,
      currentView,
      whyChanged:`Aktiviteten gick från ${prior.length} till ${recent.length} händelser. ${evidence.note}`,
      confidence,
      recentCount:recent.length,
      priorCount:prior.length,
      independentSources:evidence.independentSources,
      evidence:recent.slice(0,4).map(e=>e.title),
    });
  }
  return out.sort((a,b)=> {
    const rank=(x:BeliefShift["change"])=>x==="ny bedömning"?3:x==="stärkt"?2:1;
    return rank(b.change)-rank(a.change) || b.recentCount-a.recentCount;
  }).slice(0,6);
}
