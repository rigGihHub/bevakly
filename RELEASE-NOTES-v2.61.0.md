# Bevakly v2.61.0 – Persistent Case History foundation

## Nytt
- `case-history.ts` bygger stabila snapshots från robusta Signal Timelines.
- Varje snapshot innehåller:
  - `caseKey`
  - `observedAt`
  - `evidenceFirstSeen`
  - `evidenceLatestSeen`
  - stage
  - direction
  - escalation score
  - interpretation confidence
  - fact count
  - source classes
- Ny separat serveradapter för case-history.
- Ny migration:
  - `intelligence_cases`
  - `intelligence_case_snapshots`
- `intelligence_cases.first_observed_at` bevaras vid upsert.
- Case snapshot-tabellen skapar tidsserie per case.
- API:t exponerar `caseSnapshots` och `caseHistoryPersistence`.
- UI visar tydligt om persistent case history faktiskt är aktiv eller bara förberedd.

## Säker aktivering
DB-skrivning sker endast om:
1. `DATABASE_URL` finns.
2. `BEVAKLY_CASE_HISTORY_ENABLED=true`.
3. Schema-probe mot båda case-tabellerna lyckas.

Om något saknas fortsätter feeden utan case-persistence.

## Viktig begränsning
Migrationen medföljer releasen men är **inte verifierad som körd i produktion**.
Därför gör v2.61 fortfarande inget anspråk på äkta persistent Bevakly first-seen eller historisk product lead-time.
