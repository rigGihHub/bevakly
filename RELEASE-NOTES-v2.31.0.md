# Bevakly v2.31.0 – Discovery Scheduler & Adapter Contract

## Nytt
- Ny `discovery-scheduler.ts`.
- Bevakly väljer en begränsad daglig batch i stället för att försöka skanna alla 290 kommuner samtidigt.
- Batchstorleken är hårt begränsad till högst 24 jobb; standard i API:t är 12.
- Nationella myndigheter och länsstyrelseområden prioriteras först, men får inte fylla hela batchen. Minst en kommunplats reserveras och vid normala batchstorlekar ungefär halva kapaciteten lämnas till kommunrotationen.
- Kommuner roteras deterministiskt från dag till dag.
- Första kommunpasset försöker sprida jobben över olika län.
- Varje jobb har ett konkret intent och en konkret sökfråga.
- Jobb delas i:
  - `direct-source`: målet har redan kopplad bevakad källa.
  - `search-required`: kräver en riktig sökprovider.
- Ny `buildSearchAdapterQueue()` definierar kontraktet för framtida sökadapter: title, canonical URL, publishedAt och snippet.

## Viktig sanningsgräns
v2.31 **kör inte** externa webbsökningar för kommunmål som saknar källa. Den skapar en säker, roterande och direkt körbar jobbkedja fram till providergränsen. Det undviker falska URL:er, okontrollerade 290-anrop och påståenden om täckning som ännu inte finns.

## UI
Discovery-raden visar dagens batch, hur många län den representerar och hur många jobb som redan kan lösas via direkt källkoppling respektive kräver sökadapter.

## Nästa steg
Koppla `search-required`-jobben till en faktisk sökprovider eller kommunal sökadapter, med cache, rate limits, canonicalisering och samma Early Signal-filter som befintlig Discovery.
