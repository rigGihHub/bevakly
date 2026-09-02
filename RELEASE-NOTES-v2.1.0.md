# Bevakly v2.1.0 — Strategic Moves

## Nytt
- Strategic Moves kopplar ihop flera separata aktörssignaler till testbara strategiska hypoteser.
- Identifierar möjliga expansionsrörelser, kapacitetsuppbyggnad, konsolidering, marknadsinträde och strategiska skiften.
- Kräver minst flera händelser och flera signaltyper innan en hypotes skapas.
- Säkerhet begränsas automatiskt när oberoende källstöd saknas.
- Varje hypotes visar stödjande signaler, källdomäner, geografi, evidens, motbevis och "Bevaka härnäst".
- Pauser, nedläggningar, varsel, förseningar och liknande signaler används som motbevis och sänker hypotesens styrka.
- UI:t märker uttryckligen allt som strategisk hypotes, inte verifierad strategi.

## Produktgräns
Strategic Moves analyserar omvärlds- och konkurrentrörelser. Funktionen ska inte utvecklas till upphandlingskvalificering, anbudsanalys eller upphandlingsworkflow; det hör hemma i Anbudify.

## Verifiering
- Kärnlogiken smoke-testad separat.
- TypeScript/TSX parserkontroll körd på nya och ändrade filer.
- ZIP-integritet kontrollerad.
- Full `next build` är inte verifierad i denna arbetsmiljö.
