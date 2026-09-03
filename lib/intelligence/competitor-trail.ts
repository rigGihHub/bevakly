import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { classifyLocalSignal, type LocalSignalType } from "@/lib/intelligence/local-signals";

export type CompetitorTrailItem = {
  eventId: string;
  title: string;
  publishedAt: string | null;
  geography: string | null;
  category: string | null;
  sourceUrl?: string | null;
  signalType: LocalSignalType;
  strength: "stark" | "medel" | "svag";
  reason: string;
};

export type CompetitorTrail = {
  actor: string;
  localSignals30d: number;
  localSignals90d: number;
  strongestSignal: "stark" | "medel" | "svag" | null;
  summary: string;
  changes: string[];
  items: CompetitorTrailItem[];
};

function ageDays(value: string | null, now: Date) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : (now.getTime() - time) / 86400000;
}

function sourceName(url?: string | null) {
  try { return url ? new URL(url).hostname.replace(/^www\./, "") : ""; } catch { return ""; }
}

function uniq<T>(items: T[]) { return [...new Set(items)]; }

function rank(value: CompetitorTrailItem["strength"]) {
  return value === "stark" ? 3 : value === "medel" ? 2 : 1;
}

function signalForEvent(event: HistoricalEvent) {
  return classifyLocalSignal({
    title: `${event.title} ${event.category ?? ""}`,
    source: sourceName(event.sourceUrl),
    geographies: event.geography ? event.geography.split(",").map(x => x.trim()).filter(Boolean) : [],
  });
}

export function buildCompetitorTrail(actor: string, events: HistoricalEvent[], now = new Date()): CompetitorTrail {
  const actorRows = events
    .filter(event => event.competitors.some(name => name.toLocaleLowerCase("sv-SE") === actor.toLocaleLowerCase("sv-SE")))
    .filter(event => ageDays(event.publishedAt, now) <= 90)
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime());

  const items: CompetitorTrailItem[] = actorRows.flatMap(event => {
    const signal = signalForEvent(event);
    if (!signal) return [];
    return [{
      eventId: event.id,
      title: event.title,
      publishedAt: event.publishedAt,
      geography: event.geography,
      category: event.category,
      sourceUrl: event.sourceUrl,
      signalType: signal.type,
      strength: signal.strength,
      reason: signal.reason,
    }];
  });

  const current30 = items.filter(item => ageDays(item.publishedAt, now) <= 30);
  const previous30 = items.filter(item => { const days = ageDays(item.publishedAt, now); return days > 30 && days <= 60; });
  const geographies = uniq(current30.flatMap(item => item.geography ? item.geography.split(",").map(x => x.trim()).filter(Boolean) : []));
  const signalTypes = uniq(current30.map(item => item.signalType));
  const changes: string[] = [];

  if (current30.length >= previous30.length + 2) changes.push(`Lokala signaler har ökat: ${current30.length} senaste 30 dagarna mot ${previous30.length} föregående 30 dagar.`);
  if (signalTypes.length >= 2) changes.push(`Flera signaltyper sammanfaller: ${signalTypes.slice(0, 3).join(", ")}.`);
  if (geographies.length >= 2) changes.push(`Aktiviteten syns i flera geografier: ${geographies.slice(0, 3).join(", ")}.`);
  if (current30.some(item => item.strength === "stark")) changes.push("Minst en stark lokal signal finns i den senaste 30-dagarsperioden.");

  const strongestSignal = items.length ? [...items].sort((a, b) => rank(b.strength) - rank(a.strength))[0].strength : null;
  let summary = `Inga tydliga lokala försignaler har fångats för ${actor} i den tillgängliga 90-dagarshistoriken.`;
  if (items.length) {
    summary = `${items.length} lokala försignaler har kopplats till ${actor} under 90 dagar. ` +
      (current30.length > previous30.length
        ? "Den observerade lokala aktiviteten är högre den senaste 30-dagarsperioden."
        : "Underlaget visar ännu ingen tydlig acceleration i lokala signaler.");
  }

  return {
    actor,
    localSignals30d: current30.length,
    localSignals90d: items.length,
    strongestSignal,
    summary,
    changes: changes.slice(0, 4),
    items: items.slice(0, 10),
  };
}
