# Bevakly v2.45.0 – Article Extraction Recovery

Fokus: rädda relevanta nyhetsartiklar som hittas och går att hämta men tidigare gav för lite användbar text.

## Nytt
- JSON-LD-stöd för `NewsArticle`, `Article`, `Report`, `BlogPosting` och `AnalysisNewsArticle`, inklusive `articleBody`, `headline`, `description` och datum.
- Prioriterad textutvinning från `<article>` och `<main>` innan generisk paragrafanalys.
- Konservativ fallback till vanliga stycken när strukturerad artikeltext saknas.
- Enkel boilerplate-filtrering för cookie-, navigation-, footer-, prenumerations- och integritetstext.
- Twitter title/description som metadatafallback.
- Artikelutvinning rapporterar metod och antal extraherade tecken.
- News Intake Diagnostics visar fördelning per extraktionsmetod och andel tunna artiklar.

## Skyddsräcken
- Inga browser-/headless-anrop har lagts till.
- Ingen crawl-tid används som publiceringsdatum.
- Datum-, relevans-, dedupe- och evidenskrav är oförändrade.
- Fallbacktext släpps fortfarande genom den befintliga relevans- och scoringkedjan.

## QA
- Fokuserad TypeScript-kontroll av ändrade intelligence-moduler.
- Scenariotest av JSON-LD, `<article>`, `<main>` och cookie-/boilerplatefiltrering.
- ZIP-integritet och secrets-scan kontrolleras före release.
