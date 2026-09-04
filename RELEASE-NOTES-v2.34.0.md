# Bevakly v2.34.0 – Provider Health & Failover

## Nytt
- ny health-motor för discovery-providers
- mäter:
  - antal anrop
  - lyckade/misslyckade anrop
  - success rate
  - genomsnittlig svarstid
  - consecutive failures
  - senaste fel
- health-status:
  - healthy
  - degraded
  - unhealthy
  - unknown
- ny failover-kedja som provar nästa provider om den första fallerar
- unhealthy provider kan hoppas över om alternativ finns
- providerordning påverkas av health och latency
- första konkreta adapter-stubben: `PlaceholderSearchProvider`
- API:t visar `failoverReady:true`
- ingen extern söktjänst är fortfarande ansluten

## Viktig gräns
Placeholder-adaptern gör medvetet inga riktiga sökningar. Den finns för att testa kontrakt, health och failover utan att Bevakly låtsas ha extern täckning.

## Nästa steg
När användaren är tillbaka kan vi välja en verklig provider och lägga den bakom samma interface. Då återstår främst credentials, provider-specifik mapping och live-QA.
