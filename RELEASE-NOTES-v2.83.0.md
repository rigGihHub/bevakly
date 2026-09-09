# Bevakly v2.83.0 — Early Signal Escalation Calibration

## Why
v2.82 restored weak early-warning signals. v2.83 prevents those signals from being ranked as if they were already formal decisions or execution.

## Added
- `lib/intelligence/early-signal-escalation.ts`
- Four explicit stages: `weak-signal`, `formal-process`, `decision`, `execution`.
- Stage-specific attention (`watch`, `review`, `act`), score caps and conservative bonuses.
- Early-signal relevance now exposes escalation metadata and applies a score ceiling before tiering.
- Guardrail: escalation stage describes observed process maturity, not probability.

## Calibration
- Weak signals are capped at 69 (B) even when multiple keywords/competitors/geography inflate raw relevance.
- Formal process can reach high B but is not automatically equivalent to execution.
- Decisions and execution may receive progressively stronger attention.

## QA
- v2.83 escalation challenge: 32/32 PASS
- v2.82 false-negative challenge: 32/32 PASS
- v2.81 hard negatives: 38/38 PASS
- v2.80 real-news golden set: 20/20 PASS
- v2.79 precision benchmark: 60/60 PASS
- v2.78 source diversity: PASS

## Not verified
- Full Next.js production build
- Live provider/crawl
- Neon migrations in production
- Deploy
