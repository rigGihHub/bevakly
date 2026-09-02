import { createClient } from "@supabase/supabase-js";
import type { HistoricalEvent } from "@/lib/intelligence/signals";

export async function loadHistoricalEvents(days = 120): Promise<{enabled:boolean;events:HistoricalEvent[];reason:string|null}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const organizationId = process.env.BEVAKLY_ORGANIZATION_ID;
  if (!url || !serviceKey || !organizationId) return {enabled:false,events:[],reason:"Supabase-historik är inte konfigurerad."};

  const db = createClient(url, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const {data,error} = await db
    .from("events")
    .select("id,title,category,geography,published_at,relevance_score,canonical_url,event_competitors(competitors(name))")
    .eq("organization_id", organizationId)
    .gte("published_at", since)
    .order("published_at", {ascending:false})
    .limit(500);

  if (error) return {enabled:true,events:[],reason:error.message};

  const events: HistoricalEvent[] = (data ?? []).map((row:any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    geography: row.geography,
    publishedAt: row.published_at,
    relevanceScore: row.relevance_score,
    sourceUrl: row.canonical_url,
    competitors: (row.event_competitors ?? []).map((link:any) => link?.competitors?.name).filter(Boolean),
  }));
  return {enabled:true,events,reason:null};
}

export async function persistStrategicSignals(signals: import("@/lib/intelligence/signals").StrategicSignal[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const organizationId = process.env.BEVAKLY_ORGANIZATION_ID;
  if (!url || !serviceKey || !organizationId || signals.length === 0) return {enabled:Boolean(url&&serviceKey&&organizationId),saved:0};
  const db = createClient(url, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
  let saved = 0;
  for (const signal of signals) {
    const {error} = await db.from("strategic_signals").upsert({
      organization_id:organizationId,signal_key:signal.id,title:signal.title,summary:signal.summary,rationale:signal.rationale,
      confidence:signal.confidence,severity:signal.severity,event_count:signal.eventCount,event_ids:signal.eventIds,
      categories:signal.categories,competitors:signal.competitors,geographies:signal.geographies,first_seen:signal.firstSeen,last_seen:signal.lastSeen,
      hypothesis:true,generated_at:new Date().toISOString(),
    },{onConflict:"organization_id,signal_key"});
    if (!error) saved++;
  }
  return {enabled:true,saved};
}
