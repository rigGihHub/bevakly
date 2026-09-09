-- Bevakly v2.61.0 – Persistent Case History foundation
-- Run manually in the target Neon database only after review.
-- This migration is intentionally NOT claimed as executed by the release.

create table if not exists intelligence_cases (
  organization_id uuid not null,
  case_key text not null,
  headline text not null,
  competitors jsonb not null default '[]'::jsonb,
  geographies jsonb not null default '[]'::jsonb,
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  latest_stage text not null,
  latest_direction text not null,
  latest_score integer not null,
  latest_fact_count integer not null,
  primary key (organization_id, case_key)
);

create table if not exists intelligence_case_snapshots (
  organization_id uuid not null,
  case_key text not null,
  observed_at timestamptz not null,
  timeline_id text not null,
  evidence_first_seen timestamptz not null,
  evidence_latest_seen timestamptz not null,
  stage text not null,
  direction text not null,
  escalation_score integer not null,
  interpretation_confidence text not null,
  fact_count integer not null,
  source_classes jsonb not null default '[]'::jsonb,
  primary key (organization_id, case_key, observed_at),
  foreign key (organization_id, case_key)
    references intelligence_cases (organization_id, case_key)
    on delete cascade
);

create index if not exists idx_intelligence_cases_last_observed
  on intelligence_cases (organization_id, last_observed_at desc);

create index if not exists idx_case_snapshots_case_time
  on intelligence_case_snapshots (organization_id, case_key, observed_at asc);
