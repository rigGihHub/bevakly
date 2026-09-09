# Bevakly v2.70.0 – Intelligence Priority Engine

## Nytt
- Ny `lib/intelligence/intelligence-priority.ts`.
- Ny separat prioritering av signalcase för frågan:
  - **Vad bör användaren titta på först?**
- Priority score 0–100.
- Prioritetsnivå:
  - Kritisk
  - Hög
  - Medel
  - Låg

## Viktning
- 36% signalstyrka / attention
- 22% bedömd påverkan från Why It Matters
- 17% beviskedjans täckning från Source Gap
- 15% historiskt momentum från Case Evolution
- 10% aktualitet

Persistent cooling används som justering på attention-delen innan viktning.

## Confidence guardrails
- Låg interpretation confidence begränsar score till max 64.
- Hög prioritet kräver att interpretation confidence inte är Låg.
- Kritisk kräver:
  - score >= 82
  - Hög interpretation confidence
  - Hög impact level

Detta hindrar ett högt escalation score från att ensamt skapa en kritisk prioritet.

## UI
- “Vad håller på att hända?” sorteras nu primärt efter Intelligence Priority.
- Varje signal får en tydlig prioritetsetikett.
- Signalkorten visar komponenterna:
  - Signal
  - Påverkan
  - Bevis
  - Momentum
  - Aktualitet
- Signalstyrka visas fortsatt separat.
- Guardrail:
  - “Prioritet betyder vad som bör granskas först. Den är inte en sannolikhet…”

## Designprincip
Priority Engine skriver inte om:
- fact confidence
- interpretation confidence
- escalation score
- cooling score

Den lägger ett separat beslutslager ovanpå dessa.

## Inte verifierat
- Full Next.js production build.
- Live provider-körning.
- Produktions-Neon.
- Deploy.
