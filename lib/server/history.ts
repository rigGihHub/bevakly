import type { HistoricalEvent, StrategicSignal } from "@/lib/intelligence/signals";
import { databaseErrorMessage, ensureOrganization, getDatabase, getOrganizationId } from "@/lib/server/db";

export async function loadHistoricalEvents(days = 120): Promise<{enabled:boolean;events:HistoricalEvent[];reason:string|null}> {
  const sql = getDatabase();
  if (!sql) return {enabled:false,events:[],reason:"Databashistorik är inte konfigurerad. DATABASE_URL saknas."};

  const organizationId = getOrganizationId();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  try {
    const rows = await sql`
      select
        e.id::text as id,
        e.title,
        e.category,
        e.geography,
        e.published_at,
        e.relevance_score,
        e.canonical_url,
        coalesce(
          jsonb_agg(distinct c.name) filter (where c.name is not null),
          '[]'::jsonb
        ) as competitors
      from events e
      left join event_competitors ec on ec.event_id = e.id
      left join competitors c on c.id = ec.competitor_id
      where e.organization_id = ${organizationId}::uuid
        and e.published_at >= ${since}::timestamptz
      group by e.id
      order by e.published_at desc nulls last
      limit 500
    `;

    const events: HistoricalEvent[] = rows.map((row:any) => ({
      id: String(row.id),
      title: row.title,
      category: row.category,
      geography: row.geography,
      publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
      relevanceScore: row.relevance_score,
      sourceUrl: row.canonical_url,
      competitors: Array.isArray(row.competitors) ? row.competitors.filter(Boolean) : [],
    }));
    return {enabled:true,events,reason:null};
  } catch (error) {
    return {enabled:true,events:[],reason:databaseErrorMessage(error)};
  }
}

export async function persistStrategicSignals(signals: StrategicSignal[]) {
  if (!getDatabase()) return {enabled:false,saved:0,reason:"DATABASE_URL saknas."};
  if (signals.length === 0) return {enabled:true,saved:0,reason:null};

  try {
    const { sql, organizationId } = await ensureOrganization();
    if (!sql) return {enabled:false,saved:0,reason:"DATABASE_URL saknas."};
    let saved = 0;
    for (const signal of signals) {
      await sql`
        insert into strategic_signals (
          organization_id, signal_key, title, summary, rationale, confidence, severity,
          event_count, event_ids, categories, competitors, geographies, first_seen, last_seen,
          hypothesis, generated_at
        ) values (
          ${organizationId}::uuid, ${signal.id}, ${signal.title}, ${signal.summary}, ${signal.rationale},
          ${signal.confidence}, ${signal.severity}, ${signal.eventCount}, ${JSON.stringify(signal.eventIds)}::jsonb,
          ${JSON.stringify(signal.categories)}::jsonb, ${JSON.stringify(signal.competitors)}::jsonb,
          ${JSON.stringify(signal.geographies)}::jsonb, ${signal.firstSeen}::timestamptz,
          ${signal.lastSeen}::timestamptz, true, now()
        )
        on conflict (organization_id, signal_key) do update set
          title = excluded.title,
          summary = excluded.summary,
          rationale = excluded.rationale,
          confidence = excluded.confidence,
          severity = excluded.severity,
          event_count = excluded.event_count,
          event_ids = excluded.event_ids,
          categories = excluded.categories,
          competitors = excluded.competitors,
          geographies = excluded.geographies,
          first_seen = excluded.first_seen,
          last_seen = excluded.last_seen,
          hypothesis = true,
          generated_at = now()
      `;
      saved++;
    }
    return {enabled:true,saved,reason:null};
  } catch (error) {
    return {enabled:true,saved:0,reason:databaseErrorMessage(error)};
  }
}
