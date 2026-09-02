# Bevakly v2.2.0 — Neon history

## Nytt
- Byter server-side historiklagring från Supabase till Neon/PostgreSQL.
- Använder endast `DATABASE_URL` för databasanslutningen.
- Lagrar källor, artiklar, händelser, konkurrentkopplingar och strategiska signaler i Neon.
- Konkurrenter som upptäcks i liveflödet skapas automatiskt i historiken.
- Historikstatus i gränssnittet säger nu Neon/databas i stället för Supabase.
- Medföljande `bevakly-neon-schema.sql` skapar Bevaklys databastabeller och ett standardkonto för organisationen.
- `BEVAKLY_ORGANIZATION_ID` är valfri; utan variabel används Bevaklys seedade standardorganisation.

## Säkerhet
- `DATABASE_URL` används endast i serverkod och ska lagras som Secret i Vercel.
- Ingen anslutningssträng eller databaslösenord ingår i releasen.

## Driftsättning
1. Lägg `DATABASE_URL` som Secret i Vercel.
2. Applicera `bevakly-neon-schema.sql` på Bevakly-databasen i Neon.
3. Push v2.2.0 till GitHub. Vercel deployar automatiskt.

## Verifiering i denna release
- JSON-konfiguration och JavaScript-konfiguration syntaxkontrolleras.
- TypeScript/TSX-filer syntaxtranspileras utan att kräva installerade projektnodmoduler.
- ZIP-integritet kontrolleras.
- Full `next build` körs inte lokalt eftersom projektets npm-beroenden inte finns installerade i arbetsmiljön.
