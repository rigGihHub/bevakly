# Bevakly v3.00.3 – Source Health × Coverage Gap Intelligence

- Persistent source history is now also summarized by county and coverage dimension (procurement, permits, media, competitors, facilities).
- Coverage-gap advice combines historical accepted events with source-learning health instead of treating configured sources as equally useful.
- For weak/unknown county × dimension gaps Bevakly recommends whether to strengthen proven sources, mix known sources with exploration, or discover new regional sources.
- Recommendations are advisory only: they never raise source trust, evidence confidence or case confidence and never disable exploration.
- If persistence is unavailable, recommendations fall back safely to configured regional sources without pretending historical yield exists.

QA includes dedicated coverage-source-advisor tests plus the existing coverage, precision, golden-set, hard-negative, false-negative, procurement and regional-media suites.
