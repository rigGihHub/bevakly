# Bevakly v2.66.0 – Discovery Feedback Loop

## Nytt
- Ny `discovery-feedback-loop.ts`.
- Varje gap-driven query mäts på:
  - om den faktiskt kördes
  - antal accepterade discovery-träffar
  - andel träffar med hög faktasäkerhet
  - andel starka discovery-träffar (`score >= 75`)
  - tomma körningar
- Sökmönster får lane:
  - `preferred`
  - `standard`
  - `explore`
- Historiken kan omordna gap-driven queue innan andra discovery-passet.

## Säker lärmodell
- Lärandet kan **inte** öka querybudgeten.
- Lärandet kan **inte** stänga av ett sökmönster.
- Minst en explore-query hålls synlig tidigt när sådan finns.
- Obeprövade mönster får exploration bonus.
- Äldre ackumulerade resultat decay:ar så att gammal framgång inte dominerar för evigt.
- Runtime-state är fortfarande process-local och märks därför uttryckligen `persistent:false`.

## Exempel
Om miljögap-sökningar mot Länsstyrelsen återkommande ger:
- accepterade träffar
- hög faktasäkerhet
- höga discovery-scores

kan de flyttas till `preferred`, men fortfarande inom samma hårda maxgräns för antal queries.

## Inte verifierat
- Full Next.js-build
- live provider-körning
- persistence av feedback-state
- produktions-Neon
- deploy
