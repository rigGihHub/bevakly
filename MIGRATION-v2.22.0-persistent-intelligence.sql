-- Bevakly v2.22.0 - Persistent Intelligence
-- Run once against the existing Neon database before deploying v2.22.

create table if not exists source_run_observations (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  source_key text not null,
  source_name text not null,
  observed_at timestamptz not null,
  ok boolean not null,
  hits integer not null default 0,
  primary_items integer not null default 0,
  confirmation_contributions integer not null default 0,
  created_at timestamptz not null default now(),
  unique(organization_id,source_key,observed_at)
);
create index if not exists source_run_observations_org_source_time_idx
  on source_run_observations(organization_id,source_key,observed_at desc);

create table if not exists intelligence_observations (
  id bigserial primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  observation_key text not null,
  observed_at timestamptz not null,
  event_url text,
  title text not null,
  source_name text,
  published_at timestamptz,
  category text,
  relevance_score smallint check (relevance_score between 0 and 100),
  geographies jsonb not null default '[]'::jsonb,
  competitors jsonb not null default '[]'::jsonb,
  observation_type text not null default 'market_event',
  created_at timestamptz not null default now(),
  unique(organization_id,observation_key,observed_at)
);
create index if not exists intelligence_observations_org_time_idx
  on intelligence_observations(organization_id,observed_at desc);
create index if not exists intelligence_observations_org_published_idx
  on intelligence_observations(organization_id,published_at desc);
