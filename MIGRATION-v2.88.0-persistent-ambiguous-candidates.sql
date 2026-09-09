-- Bevakly v2.88.0 – Persistent Ambiguous Candidate Foundation
-- Review and run manually before enabling BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED=true.
-- This release does NOT claim that this migration has been executed in production.

create table if not exists intelligence_ambiguous_case_candidates (
  organization_id uuid not null,
  candidate_key text not null,
  evidence_ids jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  identity_score integer not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  first_seen timestamptz not null,
  latest_seen timestamptz not null,
  last_observed_at timestamptz not null,
  status text not null default 'held' check (status in ('held','promoted','rejected','expired')),
  allow_confidence_impact boolean not null default false check (allow_confidence_impact = false),
  promoted_at timestamptz,
  rejected_at timestamptz,
  resolution_reason text,
  primary key (organization_id,candidate_key)
);

create index if not exists idx_ambiguous_candidates_status
  on intelligence_ambiguous_case_candidates (organization_id,status,last_observed_at desc);

create index if not exists idx_ambiguous_candidates_latest_seen
  on intelligence_ambiguous_case_candidates (organization_id,latest_seen desc);
