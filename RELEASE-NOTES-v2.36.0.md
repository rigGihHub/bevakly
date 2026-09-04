# Bevakly v2.36.0 – Active Discovery Orchestrator

## Nytt
- Kopplar den roterande `authoritySearchQueue` till faktiskt konfigurerade Brave/Tavily-adapters.
- Kör ingen extern discovery alls när ingen riktig provider är konfigurerad; status blir `waiting-for-provider`.
- Hårt globalt tak på 6 discovery-frågor per körning och uppskattad kostnad 0,20 per körning.
- Failover mellan providers tar hänsyn till provider health och stoppar innan kostnadstaket passeras.
- 6-timmars minnescache gör att cacheträffar inte använder providerbudgeten.
- Alla providerträffar passerar befintlig canonicalisering, datumkontroll, relevansfilter, Early Signal, geografi/konkurrent, dedupe och Evidence Quality innan de accepteras.
- Accepterade aktiva discovery-signaler slås ihop med befintliga discovery-resultat; brus/rejected-resultat visas inte i feeden.
- Runtime-metadata redovisar antal köade/körda frågor, provider requests, cacheträffar, uppskattad kostnad, accepterade/rejected och stopporsak.

## Säkerhets-/kostnadsprincip
Failover räknas som nya provider requests och belastar samma kostnadstak. Det finns alltså ingen separat "gratis" failover-budget som kan multiplicera kostnaden.

## Viktig begränsning
Denna release är statiskt/fokuserat QA-testad i ChatGPT-miljön. Ingen live-provider har anropats och ingen deployment har gjorts. Neon production-migration är fortfarande inte verifierad.
