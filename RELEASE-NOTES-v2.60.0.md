# Bevakly v2.60.0 – Intelligence Lead-Time Score

## Nytt
- Ny **INTELLIGENCE LEAD-TIME**-panel.
- Mätningsmodell per Signal Timeline:
  - första klassade tidiga signal
  - senare bekräftelse genom nyhet, beslut/tilldelning eller genomförande
  - antal hela dagar mellan dem
- Visar:
  - genomsnittlig positiv ledtid
  - antal kedjor där tidig signal föregår bekräftelse
  - antal mätbara kedjor
  - tidiga signaler som ännu saknar senare bekräftelse
  - bästa observerade försprånget med öppningsbara källor
- Samma-dag markeras separat och räknas som mätbar men inte positiv lead-time.

## Guardrails
- Ingen bekräftelse = ingen påhittad lead-time.
- Ingen tydligt klassad tidig signal = ingen lead-time.
- Måttet heter i praktiken **current evidence-chain lead time**.
- Det påstår inte att Bevakly historiskt upptäckte förändringen före marknaden, eftersom persistent first-seen ännu inte är verifierad.

## Nästa steg
När produktionspersistens är verifierad kan första verkliga observationstid per case sparas och jämföras mot senare bred publicering för en äkta Bevakly Lead-Time KPI.
