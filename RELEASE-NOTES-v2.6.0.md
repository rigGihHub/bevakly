# Bevakly v2.6.0 — Viktigast just nu

## Nytt
- Ny sektion **Viktigast just nu** i Branschflödet.
- När flera relevanta träffar sannolikt beskriver samma utveckling grupperas de till en sammanvägd insikt.
- Klustringen väger in kategori, tidsnärhet, geografi och gemensamma betydelsebärande ord.
- Visar antal träffar, uppskattat oberoende källstöd, källor och geografi.
- Starkare källstöd ger en mindre bonus i den sammanvägda prioriteringen.
- Försiktighetsnotis gör tydligt att automatisk gruppering är en bedömning, inte verifierad identitet mellan artiklar.
- Versionsvisningen i toppraden är korrigerad till v2.6.0.

## Produktprincip
Bevakly ska hellre visa en viktig utveckling med flera belägg än fem artiklar om samma sak.

## Kontroll
- JSON-konfiguration valideras.
- Ändrade TS/TSX-filer syntaxkontrolleras om TypeScript-kompilator finns i miljön.
- ZIP-integritet kontrolleras.
- Full Next.js-build kräver installerade npm-beroenden och har inte påståtts körd om dessa saknas.
