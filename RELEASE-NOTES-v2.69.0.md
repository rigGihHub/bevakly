# Bevakly v2.69.0 – Negative Evidence & Cooling Engine

## Nytt
- Ny `lib/intelligence/negative-evidence-cooling.ts`.
- Bedömer om högprioriterade source gaps har varit kvar genom flera sparade case-observationer.
- Separat `attention score` kan justeras ned:
  - < 30 dagar: ingen poängmässig nedkylning
  - 30–59 dagar: liten bevakningsjustering
  - 60–89 dagar: svalnar
  - 90+ dagar: tydligare nedkylning
- Maximal negativ justering är begränsad till 25 poäng.
- UI visar:
  - UTEBLIVEN BEKRÄFTELSE
  - antal dagar i sparad observationshistorik
  - antal observationer
  - justerat attention score
  - tydlig begränsning att frånvaro inte är bevis.

## Viktig semantik
Bevakly säger aldrig:
> “Det finns inget miljötillstånd.”

Systemet kan endast säga:
> “Bevakly har inte observerat förväntad miljö-/tillståndsevidens i den sparade beviskedjan under observationsperioden.”

Utebliven bekräftelse är alltså en **bevakningssignal**, inte negativ fakta.

## Case History correctness-fix
Tidigare kunde varje API-refresh skapa en ny snapshot eftersom `observed_at` alltid var unikt.

v2.69 frågar nu efter senaste snapshot per case och sparar en ny snapshot endast när något materiellt har ändrats:
- evidence latest seen
- stage
- direction
- escalation score
- interpretation confidence
- fact count
- source classes

`intelligence_cases.last_observed_at` uppdateras fortfarande vid varje observerad körning.

Det innebär att Case Evolution inte längre ska förorenas av refresh-dubbletter när persistence är aktiverad.

## UI correctness-fix
De memoiserade mappar som signal-korten använder för:
- Why It Matters
- Source Gaps
- Gap discovery count

saknades i komponenten trots att JSX refererade till dem. v2.69 återställer dessa mappar och lägger även till `coolingMap`.

## Guardrails
- Cooling kräver minst två sparade observationer.
- Ingen poängmässig nedkylning före 30 dagars sparad observationsperiod.
- Endast högprioriterade gap som varit frånvarande genom hela sparade historiken kan påverka attention score.
- Faktasäkerhet ändras inte av utebliven bekräftelse.
- Escalation score skrivs inte om; cooling exponeras separat.
- Utan verifierad persistent case-historik görs ingen historisk nedkylning.

## Inte verifierat
- Full Next.js production build.
- Live provider-körning.
- Case History-persistence i produktions-Neon.
- Deploy.
