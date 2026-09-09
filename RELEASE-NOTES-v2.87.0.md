# Bevakly v2.87.0 — Ambiguous Case Holding Area

## Why
v2.86 correctly stopped ambiguous identity from entering fusion, but uncertain relations then disappeared completely. That loses potentially useful early context.

## Added
- `lib/intelligence/ambiguous-case-holding.ts`
- Ambiguous pairs with some observed identity evidence can be retained as held candidates.
- Held candidates are explicitly excluded from fusion and have `allowConfidenceImpact: false`.
- Explicit conflicts are discarded rather than held.
- Pairs already strong enough for fusion never enter the holding area.
- A 45-day window prevents stale weak correlations from accumulating indefinitely.
- Industry-feed API exposes the holding area separately from `fusedSignals`.

## Guardrail
A held candidate is not a case and is not evidence that two signals concern the same real-world event. It is only a reminder that the relation may be worth re-evaluating if stronger identity evidence appears later. In v2.87 the holding area is current-run only and is not persistent across serverless instances.

## QA
- Ambiguous candidate retained without confidence impact: PASS
- Strong same-case evidence excluded from holding: PASS
- Explicit identity conflicts excluded: PASS
- Geography-only correlation rejected as too weak: PASS
- 45-day holding window: PASS
- Previous v2.78–v2.86 regression suites: PASS

## Not verified
- Persistent holding across requests/instances
- Full Next.js production build
- Live provider/crawl
- Neon migrations in production
- Deploy
