# Bevakly v1.1.0

## Fokus
v1.1 korrigerar produktens riktning efter v1.0. Bevakly ska vara strategisk omvärlds- och konkurrentintelligence, inte ett parallellt upphandlings-/anbudsverktyg.

## Nytt
- Executive Brief: högst fem sammanvägda insikter.
- Strategic Impact: fokuserar på vad en förändring kan betyda för marknaden/verksamheten.
- Trend Intelligence: jämför senaste 30 dagar med föregående 30 dagar och markerar acceleration, stabilitet, avmattning eller nya mönster.
- Blind Spots: identifierar återkommande områden/aktörer utanför uttalad bevakning.
- Weak Signals används som underlag i Executive Brief, med krav på bekräftelse/motevidens.
- Huvudvyn förenklas. Opportunity, Customer Pain och Contract Radar ligger kvar i kodbasen för bakåtkompatibilitet men visas inte längre som primära dashboardblock.
- Tydlig produktgräns i UI: Bevakly analyserar omvärld/marknadsförändringar. Upphandlings- och anbudsarbete hör hemma i Anbudify.

## Datakrav
Blind Spots kan konfigureras med:
- `BEVAKLY_WATCH_TOPICS` – kommaseparerade kategorier.
- `BEVAKLY_WATCH_COMPETITORS` – kommaseparerade prioriterade konkurrenter.

## Teststatus
- Intelligence-moduler och API-route kontrolleras separat med TypeScript.
- Smoke-test används för trend, blind spot, strategic impact och executive brief.
- Full Next.js-build kräver installerade npm-beroenden och ska inte beskrivas som verifierad om installation/build inte faktiskt körts.
