# Bevakly v1.7.0 – Morning Brief / Nytt sedan sist

## Nytt
- **Nytt sedan sist** visas direkt ovanför Branschflödet.
- Bevakly minns föregående besök **per branschprofil** lokalt i webbläsaren.
- Samma sedan-sist-fönster behålls under hela webbläsarsessionen så en vanlig omladdning inte nollställer briefen.
- Första besöket använder senaste 24 timmarna som startpunkt.
- Om användaren varit borta mer än 30 dagar används högst 30 dagars källfönster i denna release.
- Briefen visar antal nya relevanta händelser, skyddade signaler, händelser med fler-källestöd och kategorifördelning.
- Högst fem händelser lyfts som viktigast.
- Rankningen kombinerar grundrelevans, personlig relevans, oberoende källstöd och protected-signal-regler.
- Branschflödet hämtar ett 30-dagars underlag en gång och filtrerar 24 h / 3 d / 7 d / 30 d i klienten, vilket minskar onödiga omladdningar när tidsperioden byts.
- Branschflödets resultatgräns höjs från 50 till 80 daterade händelser per hämtning.

## Produktregel
Morning Brief ska svara på **"Vad har hänt sedan jag var här sist – och vad av det är faktiskt värt min uppmärksamhet?"**. Den får prioritera men får inte dölja starka officiella eller fler-källestödda signaler för att de inte passar användarens tidigare preferenser.

## Integritet
Besökstid och personalisering sparas lokalt per bransch i webbläsaren i denna release. Ingen bakgrundsbevakning eller push-notis påstås vara aktiv.

## Verifiering
- Morning Brief-kärnan separat TypeScript-kompilerad.
- Smoke-test verifierar tidsfönster, topp-rankning, protected signals och oberoende källräkning.
- Ändrad TSX och ny TypeScript-modul parser/transpile-kontrollerade.
- ZIP-integritet kontrolleras vid paketering.
- Full `next build` är inte verifierad i arbetsmiljön om npm-beroenden saknas.
