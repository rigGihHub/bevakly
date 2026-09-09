# Bevakly v2.43.0 – Intake Recovery Engine

Fokus: rädda relevanta nyheter som tidigare föll bort av tekniska metadata-/hämtproblem utan att sänka kvalitetskraven.

## Nytt
- Bredare datumextraktion från meta-taggar, JSON-LD, `<time>`, svenska synliga datum och fler publiceringsfält.
- Konservativ datumfallback från tydliga datum i artikel-URL:er.
- Discovery-resultat som annars avvisas för saknat/otolkbart datum eller tunn metadata får ett begränsat andra försök mot originalartikeln.
- Recovery är hårt begränsad till högst 24 träffar per orchestrator-körning och 5,5 s timeout per försök.
- Recovery-resultat går tillbaka genom samma relevans-, datum-, entity-, evidence- och dedupefilter som övriga träffar.
- News Intake Diagnostics visar recovery attempts, lyckade recoveries, antal faktiskt räddade discovery-träffar och datum som återvunnits från artikel respektive URL.

## Avsiktliga begränsningar
- Inget publiceringsdatum gissas från dagens datum eller crawl-tid.
- Misslyckad artikelhämtning utan verifierbart datum släpps fortfarande inte igenom.
- Recovery ersätter inte normal discovery och har separat hårt tak för att skydda latency och Vercel-runtime.
- Providerkostnadstaket ändras inte.

## QA
Fokuserad TypeScript/static QA ska köras på de ändrade intelligence-modulerna. Full Next.js-build påstås endast om beroenden finns och faktisk build går igenom.
