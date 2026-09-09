# Bevakly v2.84.0 — Cross-Signal Escalation

## Why
A single weak signal should remain cautious. Several independent signals that progress through different process stages should be able to raise attention without turning repetition into false certainty.

## Added
- `lib/intelligence/cross-signal-escalation.ts`
- Cross-signal progression measures distinct process stages, source classes and independent sources.
- Conservative corroboration bonuses only when evidence is genuinely diverse.
- Timeline scoring now uses cross-signal score caps and progression-aware direction.

## Guardrails
- Many weak mentions remain capped at 69 and cannot manufacture a formal process or decision.
- Repetition from the same source is not independent escalation.
- Multiple formal-process mentions do not invent a decision stage.
- Escalation requires both independent evidence and observed progression across process stages.
- Score/attention is not probability.

## QA
- v2.84 cross-signal challenge: 6/6 PASS
- v2.83 escalation challenge: 32/32 PASS
- v2.82 false-negative challenge: 32/32 PASS
- v2.81 hard negatives: 38/38 PASS
- v2.80 real-news golden set: 20/20 PASS
- v2.79 precision benchmark: 60/60 PASS

## Not verified
- Full Next.js production build
- Live provider/crawl
- Neon migrations in production
- Deploy
