# Bevakly v3.00.4 – Coverage-Aware Crawl Budget

- Persistent Source Health is now actually wired into the industry-feed request path: historical source health is loaded before crawl planning, hydrated into the adaptive planner and current outcomes are persisted after the run when the feature flag/database/schema are available.
- Fixes an integration gap in v3.00.3 where the persistence adapter and migration existed but were not connected to the live crawl path. This release does not claim the production migration/flag is enabled.
- Historical county × signal-type yield can now influence fixed-source crawl priority and candidate windows through bounded Coverage Crawl Hints.
- Sparse cells may strengthen proven sources or reserve modest exploration budget for unproven regional sources, while well-covered cells do not get extra budget merely because they already produce heavily.
- Coverage budgeting never changes source trust, evidence confidence or case confidence, and no source is automatically disabled.
- The planner exposes persistent load/save status, number of hydrated sources and number of active coverage hints for diagnostics.

QA adds dedicated coverage-crawl-budget and source-health-wiring suites, and reruns the main precision, golden-set, hard-negative, false-negative, procurement, regional-media and coverage-source-advisor regressions.
