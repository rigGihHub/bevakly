# Bevakly v0.6.0

## Nytt
- Historikbaserad signalmotor som analyserar upp till 120 dagars sparade händelser.
- Identifierar tre första mönstertyper: ökad konkurrentaktivitet, geografisk marknadsaktivitet och förhöjd upphandlingsaktivitet.
- Strategiska signaler kräver flera separata datapunkter och visas alltid som hypoteser.
- Ny API-route `/api/signals` och ny dashboardpanel för signaler.
- Ingen demo-signal visas längre som om den vore en verklig upptäckt.
- Supabase-schema utökat med `strategic_signals` för framtida persistens.

## Viktigt
- Signalpanelen visar inga verkliga signaler om Supabase-historik inte är konfigurerad.
- Signalreglerna är deterministiska i v0.6. LLM används inte för att skapa samband.
- Full Next.js-build kräver installerade npm-beroenden.
