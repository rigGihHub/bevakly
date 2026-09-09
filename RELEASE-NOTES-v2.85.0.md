# Bevakly v2.85.0 — Cross-Signal Identity Protection

## Why
Cross-signal escalation becomes dangerous if two different facilities, procurements or projects are fused merely because the same competitor and municipality appear within the same time window.

## Added
- `lib/intelligence/cross-signal-identity.ts`
- Case identity fingerprints for geography, subject family, explicit reference/case IDs, property designations and project/site anchors.
- Fusion now checks case identity before allowing same-competitor events to bridge into one case.
- Explicit conflicts split cases conservatively.

## Key protections
- Different procurement/contract families (collection vs treatment vs transport) do not fuse only because company and geography match.
- Different diary/reference numbers are treated as separate cases.
- Different property designations are treated as separate cases.
- Different observed geographies for the same competitor are separated.
- M&A and local facility signals do not fuse merely on competitor identity.
- Compatible progression such as land/planning → permit → facility remains linkable.

## Guardrail
Identity protection prevents false fusion; it does not claim that two signals with no detected conflict are definitely the same real-world case. Missing identifiers remain uncertainty, not proof of identity.

## QA
- v2.85 identity pairs: 9/9 PASS
- v2.85 transitive separation: PASS (2 distinct contract chains stay 2 groups)
- Focused TypeScript compile for identity + signal fusion: PASS
- v2.84 cross-signal challenge: 6/6 PASS
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
