# Bevakly v3.00.2 – Self-learning Coverage Discovery

- Coverage-gap discovery now participates in the existing discovery feedback loop.
- Executed searches learn from accepted yield, high factual confidence and strong discovery scores.
- Repeated empty runs are cautiously down-ranked, while exploration is retained and no query pattern is automatically disabled.
- Learning only reorders the fixed four-query coverage budget; it cannot raise evidence/source/case confidence.
- Persistent learning reuses the existing `intelligence_discovery_learning` store when explicitly enabled and schema-ready; otherwise behavior remains process-local memory and is reported as such.
- Coverage learning uses county + coverage dimension identity, avoiding accidental cross-learning between e.g. procurement and permits.
- Fixed version drift: UI `APP_VERSION` and package version are both 3.00.2.

QA: self-learning coverage 7/7; coverage-gap discovery 7/7; news precision PASS; real-news golden 20/20; hard negatives 38/38; false-negative challenge 32/32; procurement reach 9/9; regional media 21/21 counties.
