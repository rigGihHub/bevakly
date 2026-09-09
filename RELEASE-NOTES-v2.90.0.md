# Bevakly v2.90.0 — Strategic Delta Engine

## Why
Bevakly ska inte bara räkna signaler. Den ska upptäcka när en konkurrents observerade beteende avviker från den egna historiska baslinjen.

## Added
- `lib/intelligence/strategic-delta.ts`
- 30-dagars recent window mot 90-dagars baseline.
- Teman: contracts, capacity, permits, planning, M&A, investment, pricing, jobs, legal.
- Case-dedupe: flera snapshots av samma case blåser inte upp aktivitet.
- Klassning: `new-pattern`, `rising`, `surging`, `falling`.
- Evidens-case keys, stage context och confidence för datamängden.
- API payload: `strategicDeltas` + `strategicDeltaSummary`.

## Guardrail
Delta beskriver förändring i Bevaklys observerade signalflöde. Det är inte sannolikhet och inte bevis för att konkurrentens verkliga strategi har ändrats. `falling` får inte tolkas som bevis för minskad verklig aktivitet.

## Persistence
Motorn kan använda persistent Case History när feature flag + schema faktiskt fungerar. Annars blir underlaget current-run och ska inte marknadsföras som historisk deltaanalys.
