# Bevakly v2.67.0 – Persistent Learning State foundation

## Nytt
- Ny serveradapter `lib/server/discovery-learning.ts`.
- Ny migration `MIGRATION-v2.67.0-persistent-discovery-learning.sql`.
- Ny feature flag:
  - `BEVAKLY_DISCOVERY_LEARNING_ENABLED=true`
- Persistent state läses **före** `rankGapDiscoveryQueue()`.
- Databasrader hydrar feedback-loopens runtime-state.
- Körningens nya observationer upsertas efter gap-driven discovery.
- UI visar om persistent learning faktiskt körs eller om processminne används.

## Persistenta mått per sökmönster
- runs
- attempted
- accepted
- high_fact
- high_score
- empty_runs
- first_observed_at
- last_observed_at
- gap_id
- source_class
- host_class
- normaliserat query_pattern

## Guardrails
- Feature-gated: databasen används inte om flaggan inte uttryckligen är `true`.
- Schema probe sker före read/write.
- Databasfel bryter inte industry feed.
- Hydration ersätter bara process-state när DB-versionen tydligt innehåller minst lika mycket historik.
- Write sker endast för queries som faktiskt körts.
- Persistent learning får fortfarande bara **omordna** queries inom befintlig budget.
- Ingen automatisk avstängning av sökmönster.
- Exploration finns kvar.
- v2.67 påstår inte att migrationen är körd i produktion.

## Migration
Kör manuellt efter granskning:
`MIGRATION-v2.67.0-persistent-discovery-learning.sql`

Därefter kan:
`BEVAKLY_DISCOVERY_LEARNING_ENABLED=true`
aktiveras i rätt miljö.

## Inte verifierat
- Full Next.js-build.
- Live provider-körning.
- Att migrationen är körd i Neon.
- Persistent learning i produktion.
- Deploy.
