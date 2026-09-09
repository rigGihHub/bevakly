# Bevakly v2.50.0 – Public Records Intelligence + Competitor Job Radar

## Fokus
Bredda tidiga signaler bortom nyheter. Offentliga handlingar och konkurrenternas egna jobbannonser får separata discovery-spår.

## Nytt
- Public Records Discovery med verifierade officiella värdar för Länsstyrelser, Konkurrensverket, Boverket och Domstolsverket.
- Competitor Job Radar för PreZero, Ragn-Sells, Stena Recycling, REMONDIS och Verdis.
- Jobbkällor använder explicit allowlist; inga karriärdomäner gissas automatiskt.
- Jobbannonser klassas konservativt som strategisk, skala/expansion eller operativ signal. En enskild jobbannons är inte bevis för expansion.
- API exponerar `competitorJobSignals`, jobbdiscovery-diagnostik och public-record-diagnostik.
- Discovery-budget höjd 18 → 20 queries/run, men kostnadstaket är fortsatt 0,20 per körning.
- Relevansmotorn använder inte längre själva sökfrågan som branschbevis. Det minskar falsk relevans från query-text.

## Begränsningar
- Public-record-registret är första arkitekturlagret, inte full svensk myndighetstäckning.
- Jobbannonser är svaga signaler ensamma och ska korsbekräftas med geografi, kontrakt, tillstånd, mark/plan eller flera rekryteringar.
- Ingen live-providerkörning eller full Next.js-build är verifierad i denna release.
- Persistent intelligence-state mot Neon är fortfarande inte verifierad i production.
