# Bevakly v2.22.0 – Persistent Intelligence

## Nytt
- Källinlärning kan nu sparas centralt i Neon i stället för enbart i webbläsaren.
- Varje källkörning sparar svar/status, antal kandidater, primära fynd och bidrag till fler-källestöd.
- Marknadshändelser får separata historiska observationer med datum, kategori, relevans och geografi.
- Source Learning räknas från upp till 180 dagars serverhistorik när Neon-tabellerna finns.
- UI visar tydligt om historiken kommer från Neon eller om Bevakly faller tillbaka till lokal webbläsarhistorik.
- Lokal historik finns kvar som säker fallback om DATABASE_URL eller v2.22-tabellerna saknas.

## Databasmigrering
Kör `MIGRATION-v2.22.0-persistent-intelligence.sql` en gång mot befintlig Neon-databas före deployment.

## Viktigt
Observationer är historiskt underlag, inte verifierade strategiska slutsatser. Bevakly ska fortfarande skilja mellan fakta, observerad förändring och maskinell bedömning.
