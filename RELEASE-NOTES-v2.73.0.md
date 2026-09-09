# Bevakly v2.73.0 – Story Provenance & Event Dedupe

## Varför
Webbresearch visade ett konkret mönster: samma branschhändelse kan finnas både på organisationens egen webbplats och på en pressdistributionsplattform. Exempelvis förekommer Kretslopp Sydosts Flishult-satsning både på egen pressida och via Newsmachine. Det ska vara **en händelse**, inte två nyheter.

## Nytt
- `news-provenance.ts`
- klassar:
  - original
  - independent-reporting
  - republisher
  - unknown
- kända distributionsvärdar får lägre provenance-vikt:
  - Via TT
  - Mynewsdesk
  - Newsmachine
  - Notified
- direkt organisations-/myndighetskälla prioriteras när samma händelse finns där.
- redaktionell bransch-/nyhetskälla kan räknas separat som möjlig oberoende bekräftelse.
- event-dedupe använder rubriklikhet + tidsnärhet.
- grupperad story behåller:
  - antal dubbletter
  - källor
  - antal möjliga oberoende bekräftelser

## Guardrail
`independent-reporting` betyder att källtypen är redaktionell i Bevaklys register. Det bevisar inte att en enskild text är journalistiskt oberoende från ett pressmeddelande.

## Inte verifierat
- full Next.js build
- live crawl av alla källor
- deploy
