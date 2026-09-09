# Bevakly v2.44.0 – Source Failure Recovery

## Mål
Öka det faktiska nyhetsinflödet genom att rädda fasta källor som tillfälligt eller strukturellt slutar ge kandidater, utan att sänka relevans- eller datumkraven.

## Nytt
- transient HTTP/network retry för fasta källor (en kontrollerad extra hämtning)
- säker fallback till källans redan konfigurerade `baseUrl` om listnings-URL:en inte kan hämtas
- RSS/Atom-autodiscovery via `<link rel="alternate">` när en fungerande HTML-sida ger noll kandidater
- enkel RSS/Atom-parser med deduplicering och samma branschnyckelordsfilter innan kandidater går vidare
- recovery-diagnostik per källa: retry, base fallback, feed discovery och vilket läge som faktiskt räddade källan
- News Intake Diagnostics visar nu antal recovery-försök och återställda källor per recovery-metod
- user-agent uppdaterad till Bevakly/2.44 och tydligare Accept-header för HTML/RSS/Atom/XML

## Skyddsräcken
- inga gissade reserv-URL:er byggs upp från källnamn
- endast källans redan konfigurerade listing/base URL och feed-länk som sidan själv annonserar används
- recovery ändrar inte datum-, relevans-, evidens- eller dedupekrav
- inga webbläsarautomationer eller aggressiv crawling läggs till

## QA
Fokuserad TypeScript/static QA ska köras på ändrade moduler. Full Next.js-build får endast påstås om hela projektets dependencies finns och build faktiskt genomförs.
