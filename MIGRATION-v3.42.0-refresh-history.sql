create table if not exists intelligence_refresh_runs (
  organization_id uuid not null,
  run_id uuid not null,
  context_key text not null,
  observed_at timestamptz not null,
  elapsed_ms integer not null check (elapsed_ms >= 0),
  total_budget_ms integer not null check (total_budget_ms > 0),
  sources_ms integer not null check (sources_ms >= 0),
  articles_ms integer not null check (articles_ms >= 0),
  discovery_ms integer not null check (discovery_ms >= 0),
  primary key (organization_id,run_id),
  check (elapsed_ms >= sources_ms + articles_ms + discovery_ms)
);
create index if not exists intelligence_refresh_runs_context_time_idx
  on intelligence_refresh_runs (organization_id,context_key,observed_at desc);
create index if not exists intelligence_refresh_runs_retention_idx
  on intelligence_refresh_runs (organization_id,observed_at);
