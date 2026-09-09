# Bevakly v2.46.0 – Feed & Sitemap Discovery

Fokus: öka nyhetsinflödet från källornas egna strukturer utan att sänka kvalitetskraven.

## Nytt
- Strukturerad discovery kompletterar svaga listningssidor när färre än fem användbara kandidater hittas.
- RSS/Atom autodiscovery via deklarerade `<link rel="alternate">`-flöden.
- Sitemap discovery via deklarerad sitemap samt `Sitemap:`-rader i källans egen `robots.txt`.
- Stöd för vanliga `<urlset>`-sitemaps och Google News-liknande `news:title`.
- Ett sitemap-index kan följas ett steg, med prioritet för sitemapnamn som innehåller news/nyhet/press/article/post/blog.
- Feed- och sitemap-kandidater slås ihop med befintliga listningskandidater och dedupliceras före artikelhämtning.
- News Intake Diagnostics visar strukturerade extraförfrågningar samt antal kandidater återvunna via feed och sitemap.

## Skyddsräcken
- Strukturerad discovery används bara när listningssidan är svag (<5 kandidater).
- Högst ett deklarerat feed hämtas per källa i den här vägen.
- Högst en toppnivå-sitemap och två undersitemaps följs per källa.
- Sitemap-URL:er från robots/index måste vara same-origin med den bevakade källan.
- Sitemap-kandidater måste fortfarande matcha branschens nyckelord innan de går vidare.
- Befintliga datum-, relevans-, artikel-, dedupe- och evidenskrav är oförändrade.

## QA
- Fokuserad TypeScript-kontroll av feed/sitemap- och recovery-moduler.
- Scenariotest för RSS, Atom, robots Sitemap, urlset och sitemapindex.
- ZIP-integritet och secrets-scan kontrolleras före release.
