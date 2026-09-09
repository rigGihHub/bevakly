# Bevakly v2.48.0 – Adaptive Source Crawl

## Fokus
Mer faktisk nyhetsnytta per crawlbudget utan att stänga av lågproduktiva källor.

## Nytt
- Processlokal adaptiv prioritering av fasta källor.
- Prioritet bygger konservativt på teknisk stabilitet, andel nya kandidater samt faktiska primär- och bekräftelsebidrag.
- Tre banor: `priority`, `standard`, `explore`.
- Priority-källor får större kandidatfönster (40), standard 24 och exploration 32 före downstream-taken.
- Ett särskilt exploration-spår håller nya och lågobserverade källor synliga så att systemet inte låser sig vid historiska vinnare.
- Ingen källa avaktiveras automatiskt.
- Runtime-state är bounded/decayad och uttryckligen `persistent:false` tills persistence är verifierad.
- API-diagnostik visar lane, prioritetspoäng, kandidatgräns och skäl per källa.

## Begränsningar
- Ingen full Next.js-build eller livekörning verifieras av denna release.
- Adaptiv state överlever inte garanterat serverless-omstarter.
