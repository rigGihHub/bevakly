# Bevakly v2.64.0 – Source Gap Detection

## Nytt
- Ny `source-gap.ts`.
- Hypotesspecifika bevismallar för:
  - expansion
  - anläggning/kapacitet
  - kontrakt/marknadsrörelse
  - regulatorisk/juridisk förändring
  - generell multi-source-förändring
- Varje robust case får:
  - täckningsnivå
  - lista över saknade bevisområden
  - prioritet per gap
  - varför gapet är viktigt
  - nästa bästa sökning

## Exempel
En expansionssignal med jobb + nyheter men utan miljö eller planärende kan få:
- **Miljösamråd eller tillstånd – Hög**
- **Kommunalt plan-/markärende – Hög**
- nästa sökning: Länsstyrelsens kungörelser / kommunala protokoll

## Guardrails
- “Saknas” betyder endast att källtypen inte finns i Bevaklys aktuella beviskedja.
- Systemet påstår inte att dokumentet eller händelsen inte existerar i verkligheten.
- Source Gap Detection ändrar inte signalens fakta; den styr nästa informationsinhämtning.
- Ett komplett mönster betyder inte att hypotesen är sann, bara att centrala bevisområden finns representerade.

## Inte verifierat
- Full Next.js-build
- live provider-körning
- deploy
- produktions-Neon/persistens
