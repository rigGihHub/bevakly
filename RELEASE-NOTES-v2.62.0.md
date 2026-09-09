# Bevakly v2.62.0 – Case Evolution Engine

## Nytt
- Ny `case-evolution.ts`.
- Jämför snapshots inom samma stabila `caseKey`.
- För varje steg räknas:
  - score-delta
  - fact-delta
  - stage-förflyttning
  - riktningsbyte
  - nya källtyper
- Bygger en enkel förklaring till varför ett case stärkts, försvagats eller haft blandad utveckling.
- Ny UI-panel **CASE EVOLUTION**.
- Exempel:
  - `58 → 71 → 84`
  - `Första signal → Formell process → Beslut/tilldelning`
  - `+2 fakta`
  - `Ny källtyp: environmental`
- Om case-history är aktiv hämtas tidigare snapshots från databasen.
- Om case-history inte är aktiv används endast aktuell körning och UI:t säger tydligt att historik saknas.

## Guardrails
- Ingen historik syntetiseras från publiceringsdatum.
- Ett enda snapshot visas som första observation, inte som en trend.
- Score-delta betyder ändrad styrka i Bevaklys beviskedja, inte sannolikhetsförändring.
- Persistent jämförelse kräver fortsatt att v2.61-migrationen är körd och feature-flaggan är aktiv.

## Inte verifierat i denna release
- Produktionens Neon-schema.
- Att migrationen har körts.
- Live cross-run case-evolution.
- Full Next.js-build/deploy.
