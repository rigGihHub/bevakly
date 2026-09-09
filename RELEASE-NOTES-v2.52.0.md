# Bevakly v2.52.0 – Signal Timeline & Escalation

## Nytt
- `signal-timeline.ts` bygger en tidslinje ovanpå v2.51 Signal Fusion.
- Fem steg: first-signal → corroborating → formal-process → decision-or-award → execution.
- Varje fusion får `escalationScore` 0–100 och riktning `escalating`, `stable` eller `cooling`.
- Formella myndighets-/kommun-/plan-/domstolssignaler höjer styrkan mer än en ensam tidig signal.
- Äldre fusioner utan nya signaler kyls ned i stället för att automatiskt avskrivas.
- API exponerar `signalTimelines` och `signalTimelineSummary`.

## Viktig begränsning
Tidslinjen byggs av den aktuella körningens fusioner. Persistent cross-run timeline påstås inte vara aktiv förrän production-databasen/migrationen är verifierad.

## QA
Fokuserad TypeScript-transpilering och isolerade scenariotester körs inför paketering. Full Next.js build kräver installerade projektdependencies och räknas inte som verifierad om de saknas.
