# Bevakly v2.20.0 – Kommunradar

## Nytt
- Kommunregister för Sveriges 290 kommuner med kommunkod och länskoppling.
- Konservativ kommunidentifiering: explicita geografi-taggar kan matcha kommunnamn; fri text kräver formuleringen “<kommunnamn> kommun” för att minska falska träffar.
- Kommunradar jämför senaste 30 dagar med föregående 30 dagar.
- Varje kommunförändring visar signaltyper, berörda aktörer, underliggande händelser och säkerhetsnivå.
- Kommun- och länsanalys delar samma spårbara faktaunderlag.
- Aktivitet uttrycks som aktivitet, inte som bekräftad strategi.

## Datagrund
Kommunnamn och kommunkoder följer SCB:s aktuella kommunindelning 2026. Län härleds från kommunkodens länsdel.

## Begränsningar
- Automatisk insamling från alla kommuners egna webbplatser ingår ännu inte; v2.20 förbättrar intelligenslagret för de kommunala signaler som faktiskt samlas in.
- Fritexttolkning är medvetet konservativ för att undvika falska träffar på kommunnamn som också är vanliga ord eller ortnamn.
- Ingen extern källa har live-verifierats som del av releasekontrollen.
