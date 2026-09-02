export type HistoricalEvent = {
  id: string;
  title: string;
  category: string | null;
  geography: string | null;
  publishedAt: string | null;
  relevanceScore: number | null;
  competitors: string[];
  sourceUrl?: string | null;
};

export type StrategicSignal = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  confidence: "hög" | "medel" | "låg";
  severity: "hög" | "medel" | "låg";
  hypothesis: true;
  eventCount: number;
  categories: string[];
  competitors: string[];
  geographies: string[];
  firstSeen: string | null;
  lastSeen: string | null;
  eventIds: string[];
};

function withinDays(value: string | null, days: number, now = new Date()) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return now.getTime() - time <= days * 86400000;
}

function dateRange(events: HistoricalEvent[]) {
  const dates = events.map(e => e.publishedAt).filter((x): x is string => Boolean(x)).sort();
  return { firstSeen: dates[0] ?? null, lastSeen: dates.at(-1) ?? null };
}

function uniq<T>(items: T[]) { return [...new Set(items)]; }

function buildSignal(input: Omit<StrategicSignal, "hypothesis">): StrategicSignal {
  return { ...input, hypothesis: true };
}

export function deriveStrategicSignals(events: HistoricalEvent[], now = new Date()): StrategicSignal[] {
  const recent = events.filter(e => withinDays(e.publishedAt, 120, now));
  const signals: StrategicSignal[] = [];

  const competitorNames = uniq(recent.flatMap(e => e.competitors));
  for (const competitor of competitorNames) {
    const rows = recent.filter(e => e.competitors.includes(competitor));
    const categories = uniq(rows.map(e => e.category).filter((x): x is string => Boolean(x)));
    const expansionLike = categories.filter(c => ["Investering", "Etablering", "Organisation", "Avtal", "Upphandling", "Förvärv"].includes(c));
    if (rows.length >= 3 && expansionLike.length >= 2) {
      const range = dateRange(rows);
      signals.push(buildSignal({
        id: `competitor-activity-${competitor.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-")}`,
        title: `Ökad strategisk aktivitet hos ${competitor}`,
        summary: `${rows.length} separata händelser inom ${categories.slice(0,4).join(", ")} har identifierats under de senaste 120 dagarna.`,
        rationale: `Flera olika signaltyper kring samma konkurrent kan tillsammans indikera ett större strategiskt initiativ. Sambandet är inte verifierat och ska följas med fler källor.`,
        confidence: rows.length >= 5 && expansionLike.length >= 3 ? "hög" : "medel",
        severity: rows.some(e => (e.relevanceScore ?? 0) >= 75) ? "hög" : "medel",
        eventCount: rows.length,
        categories,
        competitors: [competitor],
        geographies: uniq(rows.flatMap(e => e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : [])),
        ...range,
        eventIds: rows.map(e => e.id),
      }));
    }
  }

  const geoNames = uniq(recent.flatMap(e => e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : []));
  for (const geography of geoNames.filter(g => g !== "Sverige")) {
    const rows = recent.filter(e => e.geography?.split(",").map(x=>x.trim()).includes(geography));
    const competitors = uniq(rows.flatMap(e => e.competitors));
    const commercial = rows.filter(e => ["Upphandling", "Avtal", "Investering", "Etablering"].includes(e.category ?? ""));
    if (commercial.length >= 3) {
      const range = dateRange(commercial);
      signals.push(buildSignal({
        id: `geo-activity-${geography.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-")}`,
        title: `Ökad marknadsaktivitet i ${geography}`,
        summary: `${commercial.length} kommersiellt relevanta händelser har identifierats i ${geography}.`,
        rationale: `Flera upphandlingar, avtal, investeringar eller etableringar i samma område kan signalera förändrad efterfrågan eller konkurrensintensitet.`,
        confidence: commercial.length >= 5 ? "hög" : "medel",
        severity: commercial.some(e => (e.relevanceScore ?? 0) >= 75) ? "hög" : "medel",
        eventCount: commercial.length,
        categories: uniq(commercial.map(e => e.category).filter((x): x is string => Boolean(x))),
        competitors,
        geographies: [geography],
        ...range,
        eventIds: commercial.map(e => e.id),
      }));
    }
  }

  const procurement30 = recent.filter(e => e.category === "Upphandling" && withinDays(e.publishedAt, 30, now));
  if (procurement30.length >= 3) {
    const range = dateRange(procurement30);
    signals.push(buildSignal({
      id: "procurement-wave-30d",
      title: "Förhöjd upphandlingsaktivitet",
      summary: `${procurement30.length} relevanta upphandlingar har identifierats under de senaste 30 dagarna.`,
      rationale: "En tätare följd av relevanta upphandlingar kan innebära en tillfällig affärstopp eller en strukturell förändring i efterfrågan. Jämförelse mot längre historik behövs innan en trend fastställs.",
      confidence: procurement30.length >= 6 ? "hög" : "medel",
      severity: procurement30.some(e => (e.relevanceScore ?? 0) >= 75) ? "hög" : "medel",
      eventCount: procurement30.length,
      categories: ["Upphandling"],
      competitors: uniq(procurement30.flatMap(e => e.competitors)),
      geographies: uniq(procurement30.flatMap(e => e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : [])),
      ...range,
      eventIds: procurement30.map(e => e.id),
    }));
  }

  return signals
    .sort((a,b) => (b.severity === "hög" ? 2 : 1) - (a.severity === "hög" ? 2 : 1) || b.eventCount - a.eventCount)
    .slice(0, 8);
}

export type WeakSignal = {
  id: string;
  title: string;
  hypothesis: string;
  whyNow: string;
  confidence: "hög" | "medel" | "låg";
  signalStrength: number;
  eventIds: string[];
  competitors: string[];
  geographies: string[];
  categories: string[];
  watchFor: string[];
  counterEvidence: string;
};

export function deriveWeakSignals(events: HistoricalEvent[], now = new Date()): WeakSignal[] {
  const recent = events.filter(e => withinDays(e.publishedAt, 90, now));
  const out: WeakSignal[] = [];

  for (const competitor of uniq(recent.flatMap(e=>e.competitors))) {
    const rows = recent.filter(e=>e.competitors.includes(competitor));
    const cat = new Set(rows.map(e=>e.category).filter(Boolean));
    const geo = uniq(rows.flatMap(e=>e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : []));
    const capability = ["Organisation","Investering","Teknik"].filter(x=>cat.has(x));
    const commercial = ["Upphandling","Avtal","Etablering"].filter(x=>cat.has(x));
    if (rows.length >= 3 && capability.length >= 1 && commercial.length >= 1) {
      const strength = Math.min(95, 48 + rows.length*6 + capability.length*7 + commercial.length*7);
      out.push({
        id:`weak-build-${competitor.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-")}`,
        title:`Möjlig kapacitetsuppbyggnad hos ${competitor}`,
        hypothesis:`Flera olika typer av aktivitet kan tyda på att ${competitor} bygger kapacitet inför expansion, nya affärer eller ett strategiskt skifte.`,
        whyNow:`${rows.length} händelser inom ${uniq(rows.map(e=>e.category).filter((x):x is string=>Boolean(x))).slice(0,5).join(", ")} har samlats inom 90 dagar.`,
        confidence: strength >= 80 ? "hög" : "medel",
        signalStrength: strength,
        eventIds: rows.map(e=>e.id), competitors:[competitor], geographies:geo,
        categories: uniq(rows.map(e=>e.category).filter((x):x is string=>Boolean(x))),
        watchFor:["nya rekryteringar eller chefsroller","lokal/anläggning eller tillstånd","fler upphandlingar eller avtal i samma geografi"],
        counterEvidence:"Hypotesen försvagas om aktiviteten är isolerad, gäller olika affärsområden eller inte följs av fler oberoende signaler.",
      });
    }
  }

  const geoNames = uniq(recent.flatMap(e=>e.geography ? e.geography.split(",").map(x=>x.trim()).filter(Boolean) : [])).filter(x=>x!=="Sverige");
  for (const geography of geoNames) {
    const rows = recent.filter(e=>e.geography?.split(",").map(x=>x.trim()).includes(geography));
    const competitors = uniq(rows.flatMap(e=>e.competitors));
    const categories = uniq(rows.map(e=>e.category).filter((x):x is string=>Boolean(x)));
    if (rows.length >= 4 && competitors.length >= 2 && categories.length >= 2) {
      out.push({
        id:`weak-geo-${geography.toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-")}`,
        title:`Möjligt skifte i konkurrensbilden i ${geography}`,
        hypothesis:`Flera aktörer och flera händelsetyper rör sig samtidigt i ${geography}. Det kan vara början på ett lokalt marknadsskifte.`,
        whyNow:`${rows.length} händelser från ${competitors.length} konkurrenter och ${categories.length} kategorier har identifierats inom 90 dagar.`,
        confidence: rows.length >= 7 ? "hög" : "medel", signalStrength:Math.min(92,45+rows.length*5+competitors.length*6+categories.length*4),
        eventIds:rows.map(e=>e.id),competitors,geographies:[geography],categories,
        watchFor:["prisförändringar i kommande upphandlingar","nya etableringar eller underleverantörer","återkommande vinnare i tilldelningar"],
        counterEvidence:"Enskilda stora upphandlingar kan skapa tillfälligt brus. Jämför med normal aktivitet i området innan en trend fastställs.",
      });
    }
  }
  return out.sort((a,b)=>b.signalStrength-a.signalStrength).slice(0,6);
}
