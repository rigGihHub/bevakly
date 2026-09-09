# Bevakly v2.79.0 – News Precision Evaluation Harness

## Syfte
Flytta nyhetskalibreringen från magkänsla till reproducerbar QA. Den här releasen lägger ett lokalt benchmark ovanpå befintliga News Quality, Article Validation, Bid News Relevance, Fresh Event och Provenance-lager.

## Nytt
- `lib/intelligence/news-precision-evaluation.ts`
  - gemensam evaluator för artikelvalidering, news quality, Bid Manager-tier, freshness, provenance och duplicate collapse
  - mäter precision, recall, false positive/negative rate samt delmotorernas accuracy
- `scripts/news-precision-fixtures.ts`
  - 60 syntetiska fixtures: kontrakt/tilldelning, kapacitet, tillstånd, mark/etablering, M&A, investering, pris/kostnad, konkurrentförflyttning, juridik, teknik, ESG, servicebrus, kategorisidor, gamla händelser, provenance och dubbletter
- `scripts/qa-v2.79-news-precision.ts`
  - hårda kvalitetsgränser så regressioner stoppar QA
- `npm run qa:news-precision`

## Kalibreringar som benchmarken avslöjade
1. Negerade affärstermer kunde ge falsk relevans, t.ex. `utan upphandling eller investering`.
   - Bid News Relevance ignorerar nu tydliga negationer för kontrakt, investering, kapacitet, tillstånd och M&A.
2. Direkta pris-/kostnadssignaler var för svagt viktade.
   - böjningar av `behandlingsavgift` och `materialflöde` täcks bättre och pricing-temat har kalibrerats upp.
3. Kombinationen ny kapacitet + investering rankades för lågt.
   - kombinationsbonusen har förstärkts.
4. Fresh Event kunde tolka en nypublicerad bakgrundsrubrik med explicit gammalt årtal som ny händelse.
   - explicit äldre årtal i rubrik + historiska cues går nu före change-verbet.
5. Fresh Event täcker fler svenska verbböjningar för tilldelning, beslut och prisförändringar.
6. Story duplicate similarity var för strikt för svenska rubrikparafraser.
   - tröskeln är försiktigt sänkt från 0.58 till 0.40. Provenance-rankningen avgör fortfarande primärkälla.

## QA-resultat – syntetisk benchmark
- fixtures: 60
- precision: 1.000
- recall: 1.000
- false positive rate: 0.000
- false negative rate: 0.000
- article validation accuracy: 1.000
- freshness accuracy: 1.000
- provenance accuracy: 1.000
- relevant tier-floor accuracy: 1.000
- duplicate collapse accuracy: 1.000
- v2.78 source-diversity regression QA: PASS

## Viktig begränsning
Detta är en syntetisk benchmark och får inte beskrivas som bevis på 100 % precision i produktion. Den visar att de definierade regressionerna är reproducerbart skyddade. Nästa kvalitetssteg bör vara en versionslåst golden set med verkliga svenska avfallsartiklar och manuellt märkta expected outcomes.

## Inte verifierat
- full Next.js production build
- live provider run / live crawl
- Neon-migrationer
- deploy
