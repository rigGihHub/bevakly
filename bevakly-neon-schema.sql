-- Bevakly v2.2.0 - Neon/PostgreSQL schema
-- Run against the Bevakly Neon project (database: neondb).
create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  geography jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into organizations (id,name,industry,geography)
values ('11111111-1111-4111-8111-111111111111','Bevakly','Avfall & återvinning','{}'::jsonb)
on conflict (id) do nothing;

create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  website text,
  org_number text,
  aliases text[] not null default '{}',
  priority smallint not null default 2 check (priority between 1 and 3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id,name)
);

create table if not exists monitoring_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  weight smallint not null default 10 check (weight between 0 and 100),
  active boolean not null default true
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  source_key text unique,
  name text not null,
  url text not null,
  source_type text not null,
  trust_score smallint not null default 50 check (trust_score between 0 and 100),
  active boolean not null default true
);

create table if not exists raw_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id),
  canonical_url text not null unique,
  title text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  raw_text text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  canonical_url text,
  summary_fact text,
  category text,
  geography text,
  published_at timestamptz,
  relevance_score smallint check (relevance_score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  ai_interpretation text,
  ai_hypothesis boolean not null default false,
  verification_status text not null default 'unverified' check (verification_status in ('verified','partially_verified','unverified')),
  created_at timestamptz not null default now(),
  unique (organization_id,canonical_url)
);

create index if not exists events_org_published_idx on events (organization_id,published_at desc);
create index if not exists events_org_category_idx on events (organization_id,category);

create table if not exists event_sources (
  event_id uuid not null references events(id) on delete cascade,
  article_id uuid not null references raw_articles(id) on delete cascade,
  is_primary boolean not null default false,
  primary key(event_id,article_id)
);

create table if not exists event_competitors (
  event_id uuid not null references events(id) on delete cascade,
  competitor_id uuid not null references competitors(id) on delete cascade,
  relation text,
  primary key(event_id,competitor_id)
);

create table if not exists strategic_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  signal_key text not null,
  title text not null,
  summary text not null,
  rationale text not null,
  confidence text not null check (confidence in ('hög','medel','låg')),
  severity text not null check (severity in ('hög','medel','låg')),
  event_count integer not null default 0,
  event_ids jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  competitors jsonb not null default '[]'::jsonb,
  geographies jsonb not null default '[]'::jsonb,
  first_seen timestamptz,
  last_seen timestamptz,
  hypothesis boolean not null default true,
  generated_at timestamptz not null default now(),
  unique(organization_id,signal_key)
);

create index if not exists strategic_signals_org_generated_idx on strategic_signals (organization_id,generated_at desc);


-- v2.22.0 Persistent Intelligence
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
