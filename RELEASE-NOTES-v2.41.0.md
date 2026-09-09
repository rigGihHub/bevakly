# Bevakly v2.41.0 – High-volume News Intake

## Mål
Öka mängden nyheter som faktiskt når Bevaklys analyslager utan att ta bort kvalitetsgrindarna.

## Ändringar
- Providerbudget: 16 sökfrågor per körning (från 14), fortfarande max uppskattad kostnad 0,20.
- Max 14 providerträffar per fråga (från 10).
- 12 av 16 sökplatser reserveras i första hand för nyhetsdiscovery.
- Bred roterande discovery: 5 grundsökningar.
- Coverage-driven discovery: upp till 3 sökningar.
- Source expansion: 4 separata källbreddsbanor.
- Fast-source candidate/article processing cap: 120 (från 80).
- Feed item cap: 120 (från 80).
- Extern discovery-resultatpool: 60 (från 30).
- Dynamiskt upptäckta källänkar som läses: upp till 12 (från 6).
- Befintliga datum-, relevans-, Early Signal-, entity-, dedupe- och Evidence Quality-grindar behålls.
- Samtidighetsgränser behålls för att undvika request-spikar.

## Viktigt
Detta är en kodrelease. Ingen live-providerkörning, deployment eller full Next.js-build påstås vara verifierad.
