create table if not exists intelligence_coverage_budget_audit (
  id bigserial primary key,
  organization_id uuid not null,
  observed_at timestamptz not null default now(),
  source_id text not null,
  source_name text not null,
  allocated_extra_candidates integer not null default 0,
  consumed_extra_candidates integer not null default 0,
  accepted_from_extra integer not null default 0,
  gap_reasons jsonb not null default '[]'::jsonb
);
create index if not exists intelligence_coverage_budget_audit_org_time_idx on intelligence_coverage_budget_audit (organization_id,observed_at desc);
create index if not exists intelligence_coverage_budget_audit_org_source_idx on intelligence_coverage_budget_audit (organization_id,source_id,observed_at desc);
