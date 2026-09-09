# Bevakly v2.88.0 – Persistent Ambiguous Candidate Foundation

## Why
v2.87 could quarantine ambiguous case relationships, but only for the current request. That is not enough for an early-warning system: a weak candidate observed today must be available when stronger identity evidence appears later.

## What changed
- Added `MIGRATION-v2.88.0-persistent-ambiguous-candidates.sql`.
- Added feature flag `BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED`.
- Added database save/load foundation for held ambiguous candidates.
- Held candidates now include both evidence snapshots, not only evidence IDs, so they can be re-evaluated later.
- The industry-feed response exposes persistence load/save status separately from the current-run holding area.
- Database/schema errors fail closed to disabled persistence and do not break the feed.

## Guardrail
Persistence is observation memory only. Loaded candidates are **not** inserted into signal fusion in v2.88 and always have `allowConfidenceImpact: false`. This release therefore does not turn ambiguity into evidence merely because it survived across requests.

## Deployment status
The migration is supplied but has **not** been verified as executed in production. Do not enable the feature flag until the migration has been reviewed and applied.
