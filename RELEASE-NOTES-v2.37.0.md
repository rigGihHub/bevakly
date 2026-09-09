# Bevakly v2.37.0 — Signal Confidence Engine

## Syfte
Bevakly skiljer nu uttryckligen mellan säkerheten i ett faktum och säkerheten i Bevaklys tolkning av vad faktumet betyder.

## Nytt
- Ny gemensam `signal-confidence`-motor.
- `factConfidence` bedömer om själva händelsen/faktumet är väl belagt.
- `interpretationConfidence` bedömer om den strategiska tolkningen är väl belagd.
- Officiella/primära källor kan ge hög faktasäkerhet utan att automatiskt ge hög tolkningssäkerhet.
- Tolkningssäkerhet väger flera händelser, sannolikt oberoende ursprung, flera signaltyper, historisk avvikelse, ny geografi, starka stöd och motbevis.
- Hård guardrail: hög aktivitets-/publiceringsvolym ensam kan aldrig skapa hög tolkningssäkerhet.
- Discovery-resultat innehåller nu båda säkerhetsmåtten samt skäl och begränsningar.
- Analyst Brief visar separat `Fakta` och `Tolkning` i stället för en enda diffus säkerhet.
- Market Directions använder samma konservativa confidence-logik och kan inte bli en tydlig riktning enbart på grund av volym.

## Kompatibilitet
Det tidigare `confidence`-fältet finns kvar där det behövs för befintlig UI/API-kompatibilitet. För discovery speglar det faktasäkerhet; för analytiska slutsatser speglar det tolkningssäkerhet.

## QA
- Fokuserad TypeScript-kontroll av ändrade intelligensmoduler: godkänd.
- Full Next.js-build är inte verifierad eftersom release-ZIP:en saknar installerade dependencies.
- Inga API-nycklar eller hemligheter har lagts till.

## Ej gjort / ej påstått
- Ingen deployment.
- Inget live-test.
- Neon production-migration är fortsatt inte verifierad.
- Extern Brave/Tavily-discovery är inte verifierad live.
