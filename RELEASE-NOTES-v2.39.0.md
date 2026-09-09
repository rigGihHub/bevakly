# Bevakly v2.39.0 — News Coverage Engine

## Syfte
Göra nyhetsinflödet jämnare och mer komplett. Bevakly ska inte fortsätta lägga discovery-budget på ämnen och konkurrenter som redan är väl täckta bara för att de publicerar mycket.

## Nytt
- Ny `News Coverage Engine` mäter täckning i det aktuella fasta källinflödet innan extern discovery körs.
- Täckning mäts separat för centrala nyhetskategorier och samtliga prioriterade avfallskonkurrenter.
- Coverage Score visar hur många definierade täckningsmål som faktiskt nåtts.
- Underbevakade områden skapar prioriterade `coverage gaps`.
- Åtta av tolv providerplatser reserveras nu för nyhetsdiscovery; fyra för bred roterande omvärldsbevakning och upp till fyra för de största täckningsluckorna.
- Om färre än fyra tydliga täckningsluckor finns fylls de lediga nyhetsplatserna automatiskt med ytterligare breda roterande sökningar, så nyhetsvolymen inte sjunker.
- Konkurrentluckor prioriterar PreZero, Ragn-Sells och Stena Recycling högre, men Remondis, Verdis och Ohlssons får också en miniminivå.
- Ämnesluckor omfattar bland annat investering/M&A, konkurrentrörelser, regelverk, teknik, marknad och hållbarhet.
- Myndighets-/kommun-discovery använder återstående providerbudget och försvinner alltså inte.
- API:t exponerar `newsCoverage`, `coverageNewsQueue`, `rotatingNewsQueue`, antal coverage-driven queries samt antalet återstående authority slots.

## Viktig princip
Hög publiceringsvolym är inte samma sak som bra täckning. Motorn mäter därför luckor, inte bara total mängd nyheter.

## Skyddsräcken
- Samma totala maxgräns för providerfrågor per körning som v2.38.
- Samma kostnadstak som v2.38.
- Samma datum-, relevans-, dedupe- och kvalitetskrav före visning.
- Ingen falsk täckning när extern provider saknas.

## QA-begränsning
Full Next.js-build ska inte påstås verifierad om dependencies saknas. Fokuserad TypeScript/static QA, scenario-QA och ZIP-integritet körs separat.
