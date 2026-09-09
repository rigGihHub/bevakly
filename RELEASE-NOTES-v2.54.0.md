# Bevakly v2.54.0 – Konkurrentkort 2.0

## Nytt
- Ny komponent `CompetitorNow` högst i konkurrentspåret.
- Samlar aktuell discovery per bevakad aktör.
- Visar antal aktiva förändringssignaler, signaler som stärks, jobbannonser och källtyper.
- Starkaste aktuella signalen visas med escalation score och process-steg.
- Öppningsbar kronologisk beviskedja per signal.
- Rekryteringssignaler visas separat och blandas inte ihop med strategisk slutsats.
- Källtyper som jobb, kommun, miljö/tillstånd, plan/mark, juridik, konkurrens, myndighet och nyheter synliggörs.
- Mobilanpassad layout.
- Synligt versionsnummer uppdaterat till v2.54.0.

## Guardrail
En ensam jobbannons eller offentlig handling får inte ensam beskrivas som en strategisk förflyttning. Konkurrentkortet bygger strategiska formuleringar endast från befintlig Signal Fusion/Timeline.

## Begränsning
Kortet hämtar aktuell industry-feed när konkurrentspåret öppnas. Persistent cross-run signalhistorik påstås fortfarande inte vara verifierad.

## QA
Fokuserad TypeScript-transpilering av ändrade TS/TSX-filer, ZIP-integritet och secrets-scan körs inför paketering.
