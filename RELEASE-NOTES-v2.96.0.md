# Bevakly v2.96.0 – Swedish Regional News Expansion

## Mål
Bredda svensk regional nyhetsbevakning utan att sänka News Quality Gate, provenance, freshness eller dedupe.

## Nytt
- 7 verifierade regionala originalkällor: Eskilstuna Energi & Miljö, Lumire, Avfall & Återvinning Skaraborg, Kretslopp Sydost, Gästrike återvinnare, Borås Energi och Miljö samt MittSverige Vatten & Avfall.
- `regions` metadata på regionala källor.
- `summarizeSourceNetwork()` redovisar explicit regional täckning så framtida blind spots kan mätas i stället för antas.
- Ingen regional källa får högre trust bara för att geografin är undertäckt.

## Guardrails
- Egna bolags-/kommunala källor är primär fakta om egen verksamhet, inte oberoende journalistisk bekräftelse.
- Fler källor innebär inte lägre acceptance threshold.
- Drift/service-brus ska fortsatt stoppas av befintliga quality gates.

## Inte verifierat
- Full Next.js production build.
- Live crawl/yield för samtliga nya källor.
- Deploy.
