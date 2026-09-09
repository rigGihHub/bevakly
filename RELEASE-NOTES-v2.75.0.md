# Bevakly v2.75.0 – Source Article Validation

## Nytt
- Ny `lib/intelligence/source-article-validation.ts`
- Kontrollerar:
  - generiska sidtitlar
  - kategori-/tagg-/arkiv-/sök-URL:er
  - rubrik ↔ brödtext-overlap
  - extraktionsmetod
  - textmängd
  - kraftig konflikt mellan URL-år och publiceringsår

## Beslut
- `valid`
- `thin`
- `reject`

`thin` behålls men får -8 score.
`reject` stoppas innan nyhetskvalitet/scoring.

## Viktig princip
En källa kan vara trovärdig men en enskild URL kan ändå vara fel typ av sida. Source trust och article validity hålls därför separata.

## Inte verifierat
- full Next.js production build
- live crawl av samtliga källor
- deploy
