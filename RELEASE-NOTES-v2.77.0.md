# Bevakly v2.77.0 – Source Yield Prioritization

## Nytt
`adaptive-source-crawl.ts` lär sig nu per källa:
- antal Tier A-nyheter
- antal Tier B-nyheter
- högvärdes-yield per körning

A väger fullt, B väger 55 % i high-value-rate.

## Crawl-prioritering
Källscore består nu av:
- teknisk reliability
- novelty
- primära fynd/bekräftelser
- A/B-yield
- tomma körningar

En källa som efter minst 3 körningar når high-value-rate >= 0,7 kan få kandidatlimit 46 i priority lane i stället för 40.

Explore lane:
- fortsatt skyddad
- candidate limit 34
- nya/underobserverade källor får fortfarande utrymme

Ingen källa stängs automatiskt av.

## Viktig begränsning
Learning state är fortfarande process-local memory i denna release. På serverless kan lärandet därför återställas mellan instanser. Persistent source learning bör byggas först efter att produktionsdatabasen är verifierad.

## Inte verifierat
- full Next.js production build
- live crawl
- production persistence
- deploy
