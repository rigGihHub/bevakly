create table if not exists intelligence_source_health_learning (
  organization_id uuid not null,
  source_id text not null,
  runs integer not null default 0,
  ok_runs integer not null default 0,
  total_candidates integer not null default 0,
  total_unseen integer not null default 0,
  total_primary integer not null default 0,
  total_confirmations integer not null default 0,
  total_tier_a integer not null default 0,
  total_tier_b integer not null default 0,
  empty_runs integer not null default 0,
  first_run_at timestamptz not null,
  last_run_at timestamptz not null,
  primary key (organization_id, source_id)
);
create index if not exists intelligence_source_health_learning_last_run_idx on intelligence_source_health_learning (organization_id,last_run_at desc);
