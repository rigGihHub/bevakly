# Bevakly v2.71.0 – Analyst Action Queue

## Nytt
- Ny `lib/intelligence/analyst-action-queue.ts`.
- Intelligence Priority översätts till en konkret arbetskö.
- Åtgärdstyper:
  - Granska nu
  - Sök kompletterande evidens
  - Följ beslut
  - Verifiera källa
  - Bevaka / Bevaka – svalnar
  - Kan vänta
- Urgency:
  - Nu
  - Idag
  - Bevaka
  - Kan vänta
- Varje köpost visar orsak, prioritet, eventuell nästa sökning och upp till två källänkar.

## Regler
- Kritisk → Granska nu.
- Hög + högprioriterat source gap → Sök kompletterande evidens.
- Hög + formal process → Följ beslut.
- Låg interpretation confidence vid relevant score → Verifiera källa.
- Persistent cooling → Bevaka – svalnar.
- Medel → Bevaka.
- Låg → Kan vänta.

## Guardrails
- Arbetskön utför inga externa handlingar.
- Åtgärd ändrar inte fact confidence, interpretation confidence eller prioritet.
- Originalkällor visas som underlag där de finns.
- “Granska nu” betyder mänsklig analys, inte att Bevakly har bevisat hypotesen.

## Inte verifierat
- Full Next.js production build.
- Live provider-körning.
- Produktions-Neon.
- Deploy.
