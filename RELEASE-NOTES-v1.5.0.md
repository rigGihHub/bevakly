# Bevakly v1.5.0 – Source Discovery

## Nytt
- Dynamisk upptäckt av potentiellt relevanta nya källdomäner via externa länkar i redan bevakade artiklar.
- Källförslag får score, säkerhetsnivå, antal relevanta länkar, vilka befintliga källor som refererat till domänen och matchade branschbegrepp.
- Sociala nätverk, sökmotorer, CDN/annonsdomäner och redan kända källor filtreras bort.
- En ny källa visas normalt först när den återkommer från flera bevakade källor eller i flera relevanta länkar.
- Nya källor läggs aldrig till automatiskt; de visas som kandidater för granskning.
- Branschflödet har fått en separat, hopfällbar vy för källförslag.

## Kvalitetsprincip
Bevakly ska hellre missa en ny källa initialt än automatiskt släppa in en svag eller irrelevant domän. Discovery-score är därför en indikation för granskning, inte ett sanningsmått.

## Verifiering
- Source Discovery-kärnan smoke-testas separat med kontrollerade HTML-fixtures.
- TypeScript-kärnan kontrolleras separat.
- ZIP-integritet verifieras.
- Full Next.js-build/livehämtning kan inte påstås verifierad om npm-beroenden eller extern nätåtkomst saknas i arbetsmiljön.
