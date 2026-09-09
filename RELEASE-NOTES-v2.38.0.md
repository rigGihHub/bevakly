# Bevakly v2.38.0 — News Intake Expansion

## Syfte
Flytta fokus från mer analyslogik till ett betydligt rikare inflöde av relevanta nyheter och marknadssignaler.

## Nytt
- Separat roterande **News Discovery** för breda branschnyheter, investeringar, konkurrentrörelser, marknadsförflyttningar, regelverk, materialmarknader, cirkulär ekonomi, energi, miljö och teknik.
- Sex news-discovery-frågor reserveras per körning för avfallsprofilen.
- Discovery-budgeten höjs från 6 till 12 frågor per industry-feed-körning, medan kostnadstaket fortsatt är 0,20 per körning.
- Resultattak höjs från 8 till 10 per providerfråga.
- Cache för news intake sätts till 3 timmar för tätare aktualitet.
- News Discovery och myndighets-/kommunradar samsas i samma kvalitetskontroller, dedupe och kostnadstak.
- Fasta källnätet för avfall utökas från 44 till 51 källor.
- Nya verifierade källor: Sysav, Stockholm Vatten och Avfall, Vakin, Nacka vatten och avfall, Uddevalla Energi, Ohlssons och Verdis.
- Ohlssons och Verdis läggs även till som direkta konkurrentkällor.
- Brave Search använder 30-dagars freshness-filter och bättre hantering av relativa publiceringsdatum.
- Källhämtning begränsas till 8 samtidiga hämtningar och artikelberikning till 10 samtidiga hämtningar för att öka volym utan att skapa en massiv request-spik.
- API:t exponerar `newsIntake` och `newsDiscoveryQueue` för insyn i faktisk insamlingsbredd.
- Upp till 30 discovery-träffar kan nu skickas vidare i feed-responsen i stället för 12.

## Oförändrade skyddsräcken
- Inga provideranrop utan riktig API-konfiguration.
- Samma maximala uppskattade kostnad per körning: 0,20.
- Discovery-träffar måste fortfarande klara datum-, relevans-, canonicalisering- och dedupekrav.
- Bolagens egna nyheter räknas inte automatiskt som oberoende bekräftelse.
- Persistent Neon intelligence är inte verifierad live enbart genom denna release.

## QA-begränsning
Full Next.js-build ska inte påstås verifierad om dependencies saknas i releaseunderlaget. Fokuserad TypeScript/static QA och ZIP-integritet körs separat inför paketering.
