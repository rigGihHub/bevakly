# Bevakly v2.47.0 – Freshness & Incremental Crawl

## Fokus
Minska återläsning av samma feed-/sitemap-/listningsposter och prioritera nya URL:er utan att göra det aktuella flödet tomt.

## Nytt
- Ny `incremental-crawl`-modul med canonical URL-state.
- 45 dagars bounded retention, max 5 000 URL-poster.
- Nya kandidater prioriteras före nyligen sedda kandidater.
- Redan sedda kandidater får fylla återstående platser så att användaren fortfarande kan se aktuella nyheter i vald period.
- Freshness-diagnostik i `newsIntake`: considered, unseen, seenRecently, prioritizedUnseen och retainedSeenForCoverage.
- State redovisas uttryckligen som `memory` och `persistent:false`.

## Viktig begränsning
Minnesstaten överlever endast så länge serverprocessen lever. Den ska inte beskrivas som persistent incremental crawl förrän Neon-migration/deployment är verifierad. Detta är avsiktligt för att inte göra falska live-påståenden medan användaren är bortrest.

## QA
Fokuserad TypeScript/static QA av nya modulen och route-integrationen. Full Next.js-build och livekörning är inte verifierade i denna release.
