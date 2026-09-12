# Bevakly v3.00.1 — Coverage Gap → Discovery Feedback

- Swedish Coverage Gap Engine now actively allocates a bounded second discovery pass to the weakest/unknown county × signal-type combinations.
- Maximum four supplemental coverage-gap queries per run and a separate cost ceiling.
- Query intent is explicit (`coverage-gap`) and county metadata is retained.
- Permit discovery uses official-domain allowlists where possible.
- Results pass the ordinary discovery processing/quality gates and are supplemental; a coverage gap never raises source trust, evidence confidence or case confidence by itself.
- The coverage panel now reports how many targeted searches ran and how many accepted hits they produced.
- Coverage-gap results are included in the returned discovery result pool, but do not rewrite the same run's already calculated coverage matrix. This avoids self-validating coverage.
