import type { HistoricalEvent } from "@/lib/intelligence/signals";
import { assessEvidence } from "@/lib/intelligence/evidence";
import { themesForEvent } from "@/lib/intelligence/waste-taxonomy";

export type Direction = "accelererar" | "stabil" | "avtar" | "ny";
export type Confidence = "hög" | "medel" | "låg";

export type StrategicImpact = {
  id: string;
  title: string;
  whatChanged: string;
  whyItMatters: string;
  watchNext: string[];
  confidence: Confidence;
  score: number;
  eventIds: string[];
  evidence: string[];
};

export type TrendInsight = {
  id: string;
  label: string;
  direction: Direction;
  recentCount: number;
  priorCount: number;
  changePct: number | null;
  geographies: string[];
  competitors: string[];
  evidenceEventIds: string[];
  explanation: string;
};

export type BlindSpot = {
  id: string;
  title: string;
  observation: string;
  whyItMayMatter: string;
  nextCheck: string;
  confidence: Confidence;
  score: number;
  eventIds: string[];
};

export type ExecutiveBriefItem = {
  id: string;
  priority: 1 | 2 | 3 | 4 | 5;
  type: "impact" | "trend" | "blind-spot" | "weak-signal";
  title: string;
  takeaway: string;
  whyNow: string;
  action: string;
  confidence: Confidence;
  score: number;
};

function dateMs(value: string | null) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function within(value: string | null, fromDays: number, toDays: number, now: Date) {
  const ms = dateMs(value);
  if (ms === null) return false;
  const age = (now.getTime() - ms) / 86400000;
  return age >= fromDays && age < toDays;
}

function uniq<T>(values: T[]) { return [...new Set(values)]; }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9åäö]+/gi, "-").replace(/^-|-$/g, ""); }
function splitGeo(value: string | null) { return value ? value.split(",").map(x => x.trim()).filter(Boolean) : []; }
function scoreAvg(rows: HistoricalEvent[]) {
  if (!rows.length) return 0;
  return Math.round(rows.reduce((sum, row) => sum + (row.relevanceScore ?? 50), 0) / rows.length);
}

const strategicCategories = new Set(["Investering", "Etablering", "Förvärv", "Organisation", "Teknik", "Avtal", "Regelverk", "Lagstiftning", "Marknad"]);

export function deriveStrategicImpacts(events: HistoricalEvent[], now = new Date()): StrategicImpact[] {
  const recent = events.filter(e => within(e.publishedAt, 0, 45, now));
  const out: StrategicImpact[] = [];

  for (const competitor of uniq(recent.flatMap(e => e.competitors))) {
    const rows = recent.filter(e => e.competitors.includes(competitor));
    const cats = uniq(rows.map(e => e.category).filter((x): x is string => Boolean(x)));
    const strategic = cats.filter(c => strategicCategories.has(c));
    if (rows.length >= 2 && strategic.length >= 2) {
      const avg = scoreAvg(rows);
      out.push({
        id: `impact-competitor-${slug(competitor)}`,
        title: `${competitor} visar flera samtidiga strategiska rörelser`,
        whatChanged: `${rows.length} relevanta händelser inom ${strategic.slice(0, 4).join(", ")} har identifierats de senaste 45 dagarna.`,
        whyItMatters: `Flera olika händelsetyper kring samma konkurrent är mer betydelsefullt än en enskild nyhet och kan indikera förändrad prioritering, kapacitet eller marknadsposition.`,
        watchNext: ["om aktiviteten fortsätter i samma område", "om fler oberoende källor bekräftar mönstret", "om rörelserna följs av investeringar, rekryteringar eller nya samarbeten"],
        confidence: assessEvidence(rows).independentSources >= 3 && rows.length >= 4 ? "hög" : assessEvidence(rows).independentSources >= 2 ? "medel" : "låg",
        score: Math.min(96, avg + Math.min(12, rows.length * 2) + Math.min(8, assessEvidence(rows).independentSources * 2)),
        eventIds: rows.map(e => e.id),
        evidence: [...rows.slice(0, 3).map(e => e.title), assessEvidence(rows).note],
      });
    }
  }

  const regulatory = recent.filter(e => ["Regelverk", "Lagstiftning", "Politik"].includes(e.category ?? ""));
  if (regulatory.length >= 2) {
    out.push({
      id: "impact-regulatory-cluster",
      title: "Flera regel- och policyförändringar rör sig samtidigt",
      whatChanged: `${regulatory.length} relevanta regulatoriska eller politiska händelser har identifierats de senaste 45 dagarna.`,
      whyItMatters: "När flera regelspår förändras samtidigt ökar risken att marknaden påverkas snabbare än vad en enskild förändring antyder.",
      watchNext: ["ikraftträdandedatum och övergångsregler", "myndighetsvägledning", "hur konkurrenter och kunder börjar anpassa sig"],
      confidence: assessEvidence(regulatory).independentSources >= 3 && regulatory.length >= 4 ? "hög" : assessEvidence(regulatory).independentSources >= 2 ? "medel" : "låg",
      score: Math.min(94, scoreAvg(regulatory) + Math.min(8, assessEvidence(regulatory).independentSources * 2)),
      eventIds: regulatory.map(e => e.id),
      evidence: [...regulatory.slice(0, 3).map(e => e.title), assessEvidence(regulatory).note],
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}

function trendForLabel(label: string, rows: HistoricalEvent[], now: Date): TrendInsight | null {
  const recent = rows.filter(e => within(e.publishedAt, 0, 30, now));
  const prior = rows.filter(e => within(e.publishedAt, 30, 60, now));
  if (recent.length < 2 && prior.length < 2) return null;
  const change = prior.length === 0 ? null : Math.round(((recent.length - prior.length) / prior.length) * 100);
  let direction: Direction = "stabil";
  if (prior.length === 0 && recent.length >= 2) direction = "ny";
  else if (recent.length >= prior.length * 1.5 && recent.length > prior.length) direction = "accelererar";
  else if (prior.length >= recent.length * 1.5 && prior.length > recent.length) direction = "avtar";
  return {
    id: `trend-${slug(label)}`,
    label,
    direction,
    recentCount: recent.length,
    priorCount: prior.length,
    changePct: change,
    geographies: uniq(recent.flatMap(e => splitGeo(e.geography))).slice(0, 5),
    competitors: uniq(recent.flatMap(e => e.competitors)).slice(0, 5),
    evidenceEventIds: recent.map(e => e.id),
    explanation: direction === "accelererar"
      ? `Aktiviteten har ökat tydligt jämfört med föregående 30-dagarsperiod.`
      : direction === "avtar"
        ? `Aktiviteten är lägre än under föregående period.`
        : direction === "ny"
          ? `Mönstret syns nu i flera händelser men saknar jämförbar aktivitet i föregående period.`
          : `Aktiviteten ligger ungefär på samma nivå som föregående period.`,
  };
}

export function deriveTrendIntelligence(events: HistoricalEvent[], now = new Date()): TrendInsight[] {
  const candidates = new Map<string, HistoricalEvent[]>();
  for (const event of events) {
    if (event.category) {
      const key = `Kategori: ${event.category}`;
      candidates.set(key, [...(candidates.get(key) ?? []), event]);
    }
    for (const competitor of event.competitors) {
      const key = `Konkurrent: ${competitor}`;
      candidates.set(key, [...(candidates.get(key) ?? []), event]);
    }
    for (const geo of splitGeo(event.geography).filter(x => x !== "Sverige")) {
      const key = `Geografi: ${geo}`;
      candidates.set(key, [...(candidates.get(key) ?? []), event]);
    }
    for (const theme of themesForEvent(event)) {
      const key = `Tema: ${theme.label}`;
      candidates.set(key, [...(candidates.get(key) ?? []), event]);
    }
  }
  return [...candidates.entries()]
    .map(([label, rows]) => trendForLabel(label, rows, now))
    .filter((x): x is TrendInsight => Boolean(x))
    .sort((a, b) => {
      const rank = (x: Direction) => x === "accelererar" ? 4 : x === "ny" ? 3 : x === "stabil" ? 2 : 1;
      return rank(b.direction) - rank(a.direction) || b.recentCount - a.recentCount;
    })
    .slice(0, 8);
}

export function deriveBlindSpots(events: HistoricalEvent[], watchedTopics: string[] = [], watchedCompetitors: string[] = [], now = new Date()): BlindSpot[] {
  const recent = events.filter(e => within(e.publishedAt, 0, 60, now));
  const watchedTopicSet = new Set(watchedTopics.map(x => x.toLowerCase()));
  const watchedCompetitorSet = new Set(watchedCompetitors.map(x => x.toLowerCase()));
  const out: BlindSpot[] = [];

  const byCategory = new Map<string, HistoricalEvent[]>();
  for (const event of recent) if (event.category) byCategory.set(event.category, [...(byCategory.get(event.category) ?? []), event]);
  for (const [category, rows] of byCategory) {
    if (rows.length >= 3 && !watchedTopicSet.has(category.toLowerCase())) {
      out.push({
        id: `blind-category-${slug(category)}`,
        title: `${category} syns ofta men finns inte bland uttryckliga bevakningsområden`,
        observation: `${rows.length} relevanta händelser inom ${category} har identifierats de senaste 60 dagarna.`,
        whyItMayMatter: "Ett återkommande område utanför den uttalade bevakningen kan vara ett tecken på att omvärldsbilden förändras snabbare än bevakningsprofilen.",
        nextCheck: `Bedöm om ${category} bör läggas till som eget bevakningsområde eller om träffarna är tillfälligt brus.`,
        confidence: rows.length >= 5 ? "hög" : "medel",
        score: Math.min(94, scoreAvg(rows) + rows.length * 2),
        eventIds: rows.map(e => e.id),
      });
    }
  }

  const byCompetitor = new Map<string, HistoricalEvent[]>();
  for (const event of recent) for (const competitor of event.competitors) byCompetitor.set(competitor, [...(byCompetitor.get(competitor) ?? []), event]);
  for (const [competitor, rows] of byCompetitor) {
    if (rows.length >= 3 && watchedCompetitors.length > 0 && !watchedCompetitorSet.has(competitor.toLowerCase())) {
      out.push({
        id: `blind-competitor-${slug(competitor)}`,
        title: `${competitor} återkommer utan att vara prioriterad konkurrent`,
        observation: `${rows.length} relevanta händelser har kopplats till ${competitor} de senaste 60 dagarna.`,
        whyItMayMatter: "En återkommande aktör utanför den definierade konkurrentlistan kan vara en ny eller underskattad marknadsaktör.",
        nextCheck: `Kontrollera om ${competitor} bör läggas till i konkurrentbevakningen och inom vilka segment bolaget faktiskt överlappar er marknad.`,
        confidence: rows.length >= 5 ? "hög" : "medel",
        score: Math.min(93, scoreAvg(rows) + rows.length * 2),
        eventIds: rows.map(e => e.id),
      });
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}

export function buildExecutiveBrief(input: {
  impacts: StrategicImpact[];
  trends: TrendInsight[];
  blindSpots: BlindSpot[];
  weakSignals?: { id: string; title: string; hypothesis: string; whyNow: string; confidence: Confidence; signalStrength: number }[];
}): ExecutiveBriefItem[] {
  const items: Omit<ExecutiveBriefItem, "priority">[] = [];
  for (const impact of input.impacts.slice(0, 3)) items.push({
    id: impact.id, type: "impact", title: impact.title, takeaway: impact.whyItMatters,
    whyNow: impact.whatChanged, action: impact.watchNext[0] ?? "Följ utvecklingen i fler oberoende källor.", confidence: impact.confidence, score: impact.score,
  });
  const impactIds = new Set(input.impacts.map(x => x.id));
  const selectedTrendIds = new Set<string>();
  for (const trend of input.trends.filter(t => t.direction === "accelererar" || t.direction === "ny")) {
    const competitorKey = trend.id.replace(/^trend-konkurrent-/, "impact-competitor-");
    if (trend.id.startsWith("trend-konkurrent-") && impactIds.has(competitorKey)) continue;
    items.push({
      id: trend.id, type: "trend", title: `${trend.label} ${trend.direction === "accelererar" ? "accelererar" : "är ett nytt mönster"}`,
      takeaway: trend.explanation, whyNow: `${trend.recentCount} händelser senaste 30 dagarna jämfört med ${trend.priorCount} föregående period.`,
      action: "Följ om mönstret fortsätter ytterligare en period och vilka aktörer/geografier som driver förändringen.", confidence: trend.recentCount >= 4 ? "hög" : "medel",
      score: Math.min(92, 60 + trend.recentCount * 5),
    });
    selectedTrendIds.add(trend.id);
    if (selectedTrendIds.size >= 2) break;
  }
  let blindAdded = 0;
  for (const blind of input.blindSpots) {
    const categoryTrend = blind.id.startsWith("blind-category-") ? blind.id.replace(/^blind-category-/, "trend-kategori-") : null;
    const competitorTrend = blind.id.startsWith("blind-competitor-") ? blind.id.replace(/^blind-competitor-/, "trend-konkurrent-") : null;
    if ((categoryTrend && selectedTrendIds.has(categoryTrend)) || (competitorTrend && selectedTrendIds.has(competitorTrend))) continue;
    items.push({
      id: blind.id, type: "blind-spot", title: blind.title, takeaway: blind.whyItMayMatter, whyNow: blind.observation,
      action: blind.nextCheck, confidence: blind.confidence, score: blind.score,
    });
    blindAdded++;
    if (blindAdded >= 2) break;
  }
  for (const weak of (input.weakSignals ?? []).slice(0, 2)) items.push({
    id: weak.id, type: "weak-signal", title: weak.title, takeaway: weak.hypothesis, whyNow: weak.whyNow,
    action: "Sök efter oberoende bekräftelse och tecken som motsäger hypotesen innan den används som beslutsunderlag.", confidence: weak.confidence, score: weak.signalStrength,
  });

  const deduped = items
    .sort((a, b) => b.score - a.score)
    .filter((item, index, arr) => arr.findIndex(other => other.title.toLowerCase() === item.title.toLowerCase()) === index)
    .slice(0, 5);
  return deduped.map((item, index) => ({ ...item, priority: (index + 1) as ExecutiveBriefItem["priority"] }));
}
