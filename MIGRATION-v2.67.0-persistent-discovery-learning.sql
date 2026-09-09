-- Bevakly v2.67.0 – Persistent Discovery Learning
-- Review and run manually in Neon before enabling BEVAKLY_DISCOVERY_LEARNING_ENABLED=true.
-- This migration is NOT claimed to have been run by the release package.

create table if not exists intelligence_discovery_learning (
  organization_id uuid not null,
  pattern_key text not null,
  gap_id text not null,
  source_class text not null,
  host_class text not null,
  query_pattern text not null,
  runs integer not null default 0,
  attempted integer not null default 0,
  accepted integer not null default 0,
  high_fact integer not null default 0,
  high_score integer not null default 0,
  empty_runs integer not null default 0,
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  primary key (organization_id, pattern_key)
);

create index if not exists idx_intelligence_discovery_learning_last_observed
  on intelligence_discovery_learning (organization_id, last_observed_at desc);

create index if not exists idx_intelligence_discovery_learning_gap
  on intelligence_discovery_learning (organization_id, gap_id, source_class);
