-- Bevakly v2.68.0 – Evidence Promotion Loop
-- Review and run manually before enabling BEVAKLY_EVIDENCE_PROMOTION_ENABLED=true.
-- This release does NOT claim that this migration has been executed in production.

create table if not exists intelligence_pending_evidence (
  organization_id uuid not null,
  evidence_key text not null,
  originating_timeline_id text not null,
  gap_id text not null,
  source_class text not null,
  title text not null,
  url text not null,
  canonical_url text not null,
  source text not null,
  published_at timestamptz not null,
  snippet text not null default '',
  competitors jsonb not null default '[]'::jsonb,
  geographies jsonb not null default '[]'::jsonb,
  fact_confidence text not null,
  interpretation_confidence text not null,
  discovery_score integer not null,
  discovered_at timestamptz not null,
  last_seen_at timestamptz,
  status text not null default 'pending' check (status in ('pending','promoted','rejected')),
  promotion_reason text,
  promoted_at timestamptz,
  rejected_at timestamptz,
  primary key (organization_id,evidence_key)
);

create index if not exists idx_pending_evidence_status
  on intelligence_pending_evidence (organization_id,status,discovered_at);

create index if not exists idx_pending_evidence_gap
  on intelligence_pending_evidence (organization_id,gap_id,source_class);
