# Bevakly v2.92.0 – Evidence Drill-down

## Syfte
Göra Strategic Delta och Competitor Change Profile spårbara hela vägen från förändringspåstående till öppningsbar evidens, kopplingslogik, bedömning och kvarvarande evidensluckor.

## Nytt
- `lib/intelligence/evidence-drilldown.ts` bygger ett separat evidenspaket för varje Strategic Delta.
- Konkurrentprofilens delta-kort kan öppnas med **Visa evidens och resonemang**.
- Drill-down visar separat:
  - PÅSTÅENDE
  - FAKTA · ORIGINALKÄLLOR
  - VARFÖR BEVAKLY KOPPLAR IHOP DET
  - BEVAKLY BEDÖMER
  - VAD SAKNAS FORTFARANDE?
- Källor från aktuell Signal Timeline är direkt öppningsbara.
- Case räknas via `caseKey` innan förändringstakt visas för att undvika att snapshots blåser upp evidensen.
- Historiska case utan öppningsbar aktuell tidslinje markeras som evidenslucka i stället för att Bevakly hittar på underlag.
- Antal länkade case och öppningsbara källor visas i drill-down.

## Guardrails
- Öppningsbar evidens i aktuell körning är inte samma sak som full historisk evidens.
- Avsaknad av originalkälla får aldrig fyllas ut med ett antagande.
- Strategic Delta fortsätter beskriva observerad aktivitetsförändring, inte bevisad strategiförändring eller sannolikhet.
- Why It Matters visas endast när en sådan separat bedömning faktiskt är kopplad till caset.

## QA
- v2.92 Evidence Drill-down: 7/7 PASS i temporär Node-kompatibel QA-kopia.
- v2.91 Competitor Change Profile: PASS.
- v2.90 Strategic Delta: PASS.
- v2.85 Cross-Signal Identity: PASS.
- v2.84 Cross-Signal Escalation: PASS.
- v2.83 Early Escalation: 32/32 PASS.
- v2.82 False Negative Challenge: 32/32 PASS.
- v2.81 Hard Negatives: 38/38 PASS.
- v2.79 News Precision: 60/60 PASS.

## Ej verifierat
- Full Next.js production build.
- Live provider/crawl.
- Neon-migrationer i produktion.
- Deploy.
