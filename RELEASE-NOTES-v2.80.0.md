# Bevakly v2.80.0 – Real News Golden Set

## Syfte
Flytta nyhetskvalitetsarbetet från syntetiska fixtures till verkliga svenska avfalls-/återvinningsartiklar och använda felen för att förbättra motorn.

## Nytt
- `scripts/real-news-golden-set.ts`: 20 versionslåsta verkliga fall med manuellt facit.
- `scripts/qa-v2.80-real-news-golden.ts`: hård QA för relevans, tier-floor, article validation, freshness och provenance.
- `observedAt` i benchmark-fixtures: samma artikel kan bedömas vid publicering respektive när den återupptäcks långt senare.
- `REAL-NEWS-GOLDEN-SET-v2.80.0.md`: dokumenterad metod och begränsningar.

## Kalibreringar som verkliga artiklar avslöjade
1. Svenska `å/ä/ö` fungerade dåligt med JavaScripts ASCII-baserade `\b` i Fresh Event. Current-event cues använder nu svenska teckengränser.
2. Nouns som `anläggning`, `kostnad` och `upphandling` kunde ge falskt höga scores utan faktisk händelse. Relevansmotorn kräver nu mer kontextuell förändringssignal.
3. Referensmaterial som upphandlingsmallar och guider får särskild dämpning.
4. Negationer över en hel sats hanteras bättre, exempelvis `inget nytt kontrakt, tillstånd eller investering`.
5. Prisjusteringar, aktuella regeländringar, M&A, etablering och kvantifierad kapacitet får tydligare arbetsvärde.
6. Svenska sammansättningar som `återvinningsanläggning` täcks bättre.
7. Stor kvantifierad investering får extra vikt utan att blandas ihop med confidence.

## QA
- Real News Golden Set: 20/20 PASS
- v2.79 synthetic benchmark: 60/60 PASS
- v2.78 source-diversity regression: PASS

## Guardrail
100 % betyder endast att de 80 låsta testfallen passerar. Det är inte ett påstående om 100 % precision i liveflödet.

## Inte verifierat
- full Next.js production build
- live provider run / live crawl
- Neon-migrationer
- deploy
