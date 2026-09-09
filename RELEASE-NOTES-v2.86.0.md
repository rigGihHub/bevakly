# Bevakly v2.86.0 — Case Identity Confidence & Ambiguity Guard

## Why
v2.85 stopped explicit identity conflicts, but absence of a conflict was still too easy to interpret as permission to fuse. Two events can name the same competitor and still concern different real-world projects.

## Added
- `lib/intelligence/case-identity-confidence.ts`
- Four relation states: `same-case`, `probable-related`, `ambiguous`, `conflict`.
- Explicit shared anchors (diary/reference ID, property or project/site anchor) produce strong identity.
- Multiple weaker identifiers can produce a cautious `probable-related` link.
- Ambiguous relations are kept separate and cannot strengthen each other.
- Geography-only correlation without a competitor is no longer enough for fusion.

## Guardrail
No detected conflict is not evidence of identity. Missing identifiers remain uncertainty. `probable-related` means the observed evidence is sufficient to correlate for monitoring, not that Bevakly has proven the signals concern the exact same real-world case.

## QA
- v2.86 identity-confidence scenarios: 8/8 PASS
- Ambiguity guard: PASS
- Probable land/planning → permit progression remains linkable: PASS
- Focused TypeScript compile for identity confidence + signal fusion: PASS
- v2.85 identity: 9/9 PASS + transitive separation PASS
- v2.84 cross-signal escalation: 6/6 PASS
- v2.83 escalation challenge: 32/32 PASS
- v2.82 false-negative challenge: 32/32 PASS
- v2.81 hard negatives: 38/38 PASS
- v2.80 real-news golden set: 20/20 PASS
- v2.79 precision benchmark: 60/60 PASS
- v2.78 source-diversity regression: PASS

## Not verified
- Full Next.js production build
- Live provider/crawl
- Neon migrations in production
- Deploy
