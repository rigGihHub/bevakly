# Bevakly v3.01.0 – News Core Focus

## Fokus
Bevakly återcentreras tydligt kring produktens huvuduppgift: färska nyheter om avfalls- och återvinningsbranschen generellt och konkurrenterna i synnerhet.

## Nytt
- Reserverad competitor-news discovery-lane för de konkurrenter som användaren faktiskt bevakar.
- Upp till sex separata konkurrentfrågor per körning, i stället för att flera bolag klumpas ihop i en enda sökning.
- Bevakningsprofilens valda aktörer skickas till industry-feed-API:t och styr konkurrentdiscovery.
- Ny tydlig "Nyheter först"-yta i branschflödet med två spår: Branschen just nu och Konkurrentnyheter.
- Befintliga kvalitetsfilter, freshness, provenance och dedupe ligger kvar; en reserverad lane innebär inte lägre evidenskrav.

## Guardrails
- Konkurrentträffar blir inte strategiska slutsatser bara för att bolagsnamnet förekommer.
- Egna pressmeddelanden är observationer och ska inte räknas som oberoende bekräftelse.
- Om discovery-provider saknas visas inte påhittade resultat; fasta källor fortsätter fungera.

## QA
- v3.01 News Core Focus: 7/7 PASS
- News Precision: 60 fixtures, 0 failures
- Real News Golden Set: 20/20 PASS
- Hard Negatives: 38/38 PASS
- False Negative Challenge: 32/32 PASS

Full Next.js/TypeScript-build är inte verifierad i arbetsmiljön eftersom projektdependencies saknas. TSC visar dessutom äldre typfel i kodbasen som föregår v3.01.0.
