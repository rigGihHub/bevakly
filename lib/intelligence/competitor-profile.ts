import type { HistoricalEvent } from "@/lib/intelligence/signals";

export type CompetitorProfile = {
  name: string;
  eventCount120d: number;
  eventCount30d: number;
  previous30d: number;
  momentum: "accelererar" | "stabil" | "avtar";
  momentumPct: number | null;
  averageScore: number;
  latestEventAt: string | null;
  categories: { name: string; count: number }[];
  geographies: { name: string; count: number }[];
  timeline: HistoricalEvent[];
};

function daysAgo(value: string | null, now: Date) {
  if (!value) return Number.POSITIVE_INFINITY;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - t) / 86400000;
}

function topCounts(values: string[], limit = 5) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,limit).map(([name,count])=>({name,count}));
}

export function buildCompetitorProfiles(events: HistoricalEvent[], now = new Date()): CompetitorProfile[] {
  const names = [...new Set(events.flatMap(e => e.competitors))];
  return names.map(name => {
    const rows = events.filter(e => e.competitors.includes(name) && daysAgo(e.publishedAt, now) <= 120)
      .sort((a,b)=>new Date(b.publishedAt ?? 0).getTime()-new Date(a.publishedAt ?? 0).getTime());
    const current30 = rows.filter(e => daysAgo(e.publishedAt, now) <= 30).length;
    const previous30 = rows.filter(e => { const d=daysAgo(e.publishedAt, now); return d > 30 && d <= 60; }).length;
    const momentumPct = previous30 === 0 ? (current30 > 0 ? null : 0) : Math.round(((current30-previous30)/previous30)*100);
    let momentum: CompetitorProfile["momentum"] = "stabil";
    if (current30 >= previous30 + 2 || (previous30 > 0 && (momentumPct ?? 0) >= 50)) momentum = "accelererar";
    else if (previous30 >= current30 + 2 || (previous30 > 0 && (momentumPct ?? 0) <= -50)) momentum = "avtar";
    const scored = rows.map(e=>e.relevanceScore).filter((x): x is number => typeof x === "number");
    return {
      name,
      eventCount120d: rows.length,
      eventCount30d: current30,
      previous30d: previous30,
      momentum,
      momentumPct,
      averageScore: scored.length ? Math.round(scored.reduce((a,b)=>a+b,0)/scored.length) : 0,
      latestEventAt: rows[0]?.publishedAt ?? null,
      categories: topCounts(rows.map(e=>e.category ?? "Övrigt")),
      geographies: topCounts(rows.flatMap(e=>e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : [])),
      timeline: rows.slice(0,10),
    };
  }).sort((a,b)=>b.eventCount30d-a.eventCount30d || b.eventCount120d-a.eventCount120d || b.averageScore-a.averageScore);
}
