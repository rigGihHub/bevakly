# Bevakly v2.40.0 – Source Expansion & Local/International Discovery

## Syfte
Öka faktisk nyhetsbredd utan att bara öka antalet dubletter från samma stora källor.

## Nytt
- Ny `source-expansion-plan` med fyra separata discovery-banor:
  - lokal/regional media
  - konkurrentägda källor
  - svensk branschmedia
  - internationella nyheter med svensk relevans
- News Discovery reserverar nu upp till 10 av 14 providerfrågor per körning.
- Coverage Engine finns kvar men använder 2 adaptiva platser; fyra platser är reserverade för källbredd och fyra för bred tematisk discovery.
- Återstående providerbudget används fortsatt för myndighets-/kommunradarn.
- Providerfrågetaket höjs från 12 till 14, medan uppskattat kostnadstak ligger kvar på 0,20 per körning.
- PreZeros permanenta nyhetskälla uppdaterad till den nuvarande svenska nyhets-/opinionssidan.
- API-responsen redovisar `sourceExpansion`, `sourceExpansionQueries` och själva `sourceExpansionQueue` för transparens/QA.

## Varför
Många publiceringar om samma stora nyhet skapar inte bättre omvärldsbevakning. Den här releasen försöker i stället hitta nyheter från fler typer av ursprung och fler geografier.

## Begränsningar
- Extern discovery körs fortfarande bara om en riktig provider är konfigurerad.
- Full live-täckning kan inte påstås innan deployment och verkliga provideranrop har verifierats.
- Internationella träffar måste fortfarande passera samma relevans-, datum-, dedupe- och evidensfilter.
