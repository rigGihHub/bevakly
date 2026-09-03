# Bevakly v2.19.0 – Lokal marknadsradar

## Nytt
- Ny geografisk intelligensmotor ovanpå den befintliga lokala signalmotorn.
- Lokala signaler normaliseras mot län och större marknadsregion när underlaget räcker.
- Radarn jämför senaste 30 dagar med föregående 30 dagar per geografi.
- Konkurrentnamn i underlaget kopplas till geografiska förändringar.
- UI visar antal signaler, signaltyper, berörda aktörer och säkerhetsnivå.
- Analysen säger uttryckligen att observerad aktivitet inte är samma sak som bekräftad strategi.
- Varje geografisk förändring behåller stödjande händelser i motorn så att slutsatsen kan spåras till underlaget.

## Säkerhetsprincip
Hög geografisk säkerhet kräver flera händelser och minst två oberoende källdomäner i den aktuella perioden. En ensam träff får inte bli en stark strategisk slutsats.

## Begränsningar
- Kommunnormalisering är ännu inte komplett; detta är avsiktligt inför v2.20 Kommunradar.
- Geografisk normalisering bygger i denna release på befintliga geografi-taggar samt ett konservativt svenskt län/ortslexikon.
- Ingen extern källa har live-verifierats i denna release.
