# Bevakly v2.99.0 – Freshness & Source Health

## Mål
Göra det självklart hur användaren hämtar färsk information och vad senaste hämtningen faktiskt lyckades kontrollera.

## Ändringar
- Primär knapp: **Uppdatera bevakning**.
- Knappen visar senaste serverhämtningens tidpunkt.
- Manuell uppdatering skickar cache-busting refresh-parameter och använder `cache: no-store`.
- Ny current-run Source Health-sammanfattning: OK, låg/ingen yield och fel.
- Visar antal kontrollerade källor, producerande källor och kandidater i senaste körningen.
- En källa med 0 kandidater klassas som `low-yield`, inte som trasig.
- En källa med fetch-fel klassas som `failed`.

## Viktig begränsning
Statusen beskriver **senaste körningen**, inte långsiktig produktionshälsa. En källa kan vara frisk men tyst, och en lyckad enstaka körning bevisar inte stabil crawl-health över tid.
