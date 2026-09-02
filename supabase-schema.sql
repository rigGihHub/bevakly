-- Bevakly v0.1 draft schema. Run in a dedicated Bevakly Supabase project.
create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text not null,
  geography jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  primary key (organization_id,user_id)
);

create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  website text,
  org_number text,
  aliases text[] not null default '{}',
  priority smallint not null default 2 check (priority between 1 and 3),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

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

create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  feedback text not null check (feedback in ('important','relevant','irrelevant','saved')),
  created_at timestamptz not null default now()
);

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table competitors enable row level security;
alter table monitoring_topics enable row level security;
alter table events enable row level security;
alter table user_feedback enable row level security;

create or replace function is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create policy "members read organizations" on organizations for select using (is_org_member(id));
create policy "members read competitors" on competitors for select using (is_org_member(organization_id));
create policy "members read topics" on monitoring_topics for select using (is_org_member(organization_id));
create policy "members read events" on events for select using (is_org_member(organization_id));
create policy "members manage feedback" on user_feedback for all using (is_org_member(organization_id)) with check (is_org_member(organization_id) and user_id = auth.uid());


-- v0.4 migrations for existing Bevakly databases
alter table sources add column if not exists source_key text;
create unique index if not exists sources_source_key_uq on sources(source_key) where source_key is not null;
alter table events add column if not exists canonical_url text;
create unique index if not exists events_org_canonical_url_uq on events(organization_id, canonical_url) where canonical_url is not null;

-- v0.6: persisted strategic signals. Generated signals are hypotheses and must never be treated as verified facts.
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
  event_ids uuid[] not null default '{}',
  categories text[] not null default '{}',
  competitors text[] not null default '{}',
  geographies text[] not null default '{}',
  first_seen timestamptz,
  last_seen timestamptz,
  hypothesis boolean not null default true,
  generated_at timestamptz not null default now(),
  unique(organization_id, signal_key)
);
alter table strategic_signals enable row level security;
create policy "members read strategic signals" on strategic_signals for select using (is_org_member(organization_id));
