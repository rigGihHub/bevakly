import type { HistoricalEvent } from "@/lib/intelligence/signals";

export type EvidenceQuality = {
  eventCount: number;
  independentSources: number;
  domains: string[];
  confirmation: "stark" | "delvis" | "svag";
  note: string;
};

export function sourceDomain(event: HistoricalEvent): string | null {
  if (!event.sourceUrl) return null;
  try { return new URL(event.sourceUrl).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return null; }
}

export function assessEvidence(rows: HistoricalEvent[]): EvidenceQuality {
  const domains = [...new Set(rows.map(sourceDomain).filter((x): x is string => Boolean(x)))];
  const independentSources = domains.length;
  let confirmation: EvidenceQuality["confirmation"] = "svag";
  if (independentSources >= 3) confirmation = "stark";
  else if (independentSources >= 2) confirmation = "delvis";
  return {
    eventCount: rows.length,
    independentSources,
    domains,
    confirmation,
    note: independentSources >= 2
      ? `${independentSources} oberoende källdomäner stödjer mönstret.`
      : rows.length > 1
        ? `${rows.length} händelser finns, men de kan inte bekräftas från flera oberoende källdomäner.`
        : "Endast en källhändelse stödjer bedömningen.",
  };
}
