# Bevakly v2.33.0 – Provider Abstraction & Cache

## Nytt
- neutralt `DiscoveryProvider`-interface
- central `runDiscoveryProvider()` för alla framtida sökproviders
- minnescache med 6 timmars TTL
- query-limit per körning
- resultatlimit per fråga
- retry med exponentiell backoff
- uppskattat kostnadstak per körning
- cacheträffar förbrukar inte providerbudget
- normalisering och deduplicering av providerträffar innan resultatpipeline
- runtime-status exponeras i API/UI

## Standardpolicy
- max 6 providerfrågor per körning
- max 8 resultat per fråga
- max uppskattad providerkostnad 0,20 per körning
- 2 retries
- exponentiell backoff
- 6 h cache

## Viktig gräns
Ingen faktisk extern provider är ansluten ännu. Providerlagret är färdigt och `providerConnected:false` visas fortsatt. Nästa implementation kan därför läggas bakom samma interface utan att analys-, scheduler- eller UI-lagren behöver byggas om.
