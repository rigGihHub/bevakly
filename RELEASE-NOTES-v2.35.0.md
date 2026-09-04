# Bevakly v2.35.0 – Real Provider Adapters Prepared

## Nytt
Två riktiga discovery-provideradapters är nu implementerade bakom Bevaklys neutrala `DiscoveryProvider`-interface.

### Brave Search
- GET mot Brave Web Search API
- `X-Subscription-Token`
- Sverige + svenska som standard
- max 20 resultat enligt API-gräns
- mappar `web.results[].title`, `url`, `description`
- använder `page_age/age` som publiceringsdatum när det går att tolka
- credential: `BRAVE_SEARCH_API_KEY`

### Tavily Search
- POST mot Tavily `/search`
- Bearer auth
- `search_depth=basic`
- `topic=news` som standard för att kunna få `published_date`
- max 20 resultat
- mappar `title`, `url`, `content`, `published_date`
- credential: `TAVILY_API_KEY`

## Runtime
- `discoveryProviderConfigStatus()` visar vilka adapters som faktiskt har credentials.
- `providerConnected` blir true först när minst en riktig provider är konfigurerad.
- Inga API-nycklar hårdkodas eller exponeras.

## Viktig gräns
v2.35 förbereder riktiga adapters men **kör fortfarande inte provider-sökningarna från industry-feed-route**. Nästa steg är att koppla den roterande search queue-kedjan till `configuredDiscoveryProviders()` + failover + result pipeline, med hårt query- och kostnadstak.
