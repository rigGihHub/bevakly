# Bevakly v2.82.0 – False Negative Challenge Set

## Mål
Minska risken att news quality-arbetet blivit så strikt att tidiga men affärsvärdefulla signaler tappas bort.

## Nytt
- Ny låst challenge-svit med 32 svagt formulerade early-warning-fall.
- Nytt early-signal-lager i `bid-news-relevance.ts`.
- Känner igen förstadier inom mark/plan, tillstånd, kommande upphandling, operativ kapacitet, uppstartsrekrytering, pris/villkor, ägarstruktur och konkurrentförflyttning.
- `news-quality.ts` känner igen samma typ av verifierbara förstadier utan att generellt sänka kvalitetsgränsen.
- Early signal är fortfarande inte samma sak som bevisad etablering/affär. Den hålls på strategisk B-nivå när källtexten visar en konkret processförändring.

## Viktig kalibrering
Initial challenge: 0/32 accepterade. Efter separat early-signal-logik: 32/32.

## Regression QA
- v2.82 false negatives: 32/32 PASS
- v2.81 hard negatives: 38/38 PASS
- v2.80 real-news golden set: 20/20 PASS
- v2.79 precision suite: 60/60 PASS
- Totalt låsta scenarier: 150

## Guardrail
Förstadiesignal betyder att något observerbart har hänt i processen, inte att slututfallet är säkert. Exempel: planbesked är inte samma sak som etablering och samråd är inte samma sak som beviljat tillstånd.

## Ej verifierat
- Full Next.js production build
- Live provider/crawl
- Neon-migrationer
- Deploy
