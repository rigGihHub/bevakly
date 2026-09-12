# Bevakly v3.00.6 – Multi-run Crawl Budget Effectiveness

## Nytt
- sparar täckningsstyrd crawl-budget per källkörning när persistent source-health learning är aktiverad
- jämför extra kandidatbudget, faktiskt konsumerad extrabudget och accepterad extra yield över 90 dagar
- visar produktiva körningar och yield per 100 extra lästa kandidater
- rankar källor efter faktiskt historiskt utfall, inte efter tilldelad budget

## Guardrails
- historisk effekt påverkar inte evidensens confidence
- endast kandidater utanför ordinarie baseline räknas som extra yield
- historik visas bara när databastabellen och feature flag finns; ingen produktionspersistens påstås annars

## Databas
Kör `MIGRATION-v3.00.6-coverage-budget-audit.sql` innan historiken aktiveras i produktion.
