# Bevakly v2.65.0 – Gap-Driven Discovery

## Nytt
- Ny `gap-driven-discovery.ts`.
- Högprioriterade source gaps kan nu skapa riktade provider-queries.
- Querybyggaren använder:
  - konkurrent
  - geografi
  - gaptyp
  - explicit verifierade officiella hosts när sådana finns
- Exempel:
  - miljögap → `lansstyrelsen.se`
  - juridiskt gap → `domstol.se`
  - plan-/markgap i verifierad kommun → kommunens allowlistade host
  - annars Boverket som fallback för planrelaterad offentlig källa
- Separat andra discovery-pass:
  - max 4 queries
  - max 8 resultat/query
  - separat kostnadstak 0.04
  - 90 dagars maxålder för kompletterande evidens

## Viktig arkitekturspärr
Gapen uppstår först efter ordinarie fusion. Därför får andra passets träffar **inte** tyst påverka fusionen i samma request.
De exponeras som kompletterande discovery och får bli del av ordinarie fusion först när de passerat samma kvalitetsflöde i nästa analyscykel.

## Guardrails
- Endast Hög-prioriterade gap skapar extra queries.
- Kommunala domäner gissas aldrig.
- Officiella host-allowlists används där verifierade källor finns.
- Extra discovery har eget query- och kostnadstak.
- Ett sökresultat räknas inte automatiskt som nytt fakta i aktuell signal.

## Inte verifierat
- Full Next.js-build
- live provider-körning
- produktions-Neon
- deploy
