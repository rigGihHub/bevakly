# Bevakly v2.72.0 – News Quality Gate

## Fokus
Den här releasen prioriterar **precision och nyhetskvalitet** framför ytterligare feature-utbyggnad.

## News Quality Gate
Ny `lib/intelligence/news-quality.ts`.

Varje artikel bedöms efter:
- tydlig avfalls-/återvinningskoppling
- ämneskoppling i rubriken
- strategiska förändringstermer
- kvalitet på artikelutvinningen
- textmängd
- geografi
- konkurrentkoppling

Beslut:
- `accept`
- `accept-thin`
- `reject`

`accept-thin` får högst score 54 och visas som `Bevaka`.

## Brusfilter
Service-/navigationslika träffar straffas kraftigt, exempelvis:
- lediga jobb
- cookie/integritet
- kundservice
- öppettider
- sorteringsguide
- återvinningskalender
- driftinformation
- prislista

## Extraction correctness
`factualSummary` använde tidigare `description || textSample`.
Det innebar att en kort metabeskrivning kunde vinna över rikare extraherad artikeltext.

Nu används:
`textSample || description`

## Viktig princip
En känd källa är inte automatiskt en bra nyhet. Källans trust score och artikelns nyhetskvalitet är separata frågor.

## Inte verifierat
- Full Next.js production build.
- Live fetch mot samtliga fasta källor.
- Live provider-körning.
- Deploy.
