# Bevakly v2.78.0 — Source Diversity & Blind-Spot Protection

## Varför
Adaptive Source Crawl ska inte skapa en filterbubbla där historiskt hög yield tränger undan nya, lokala eller underrepresenterade källtyper.

## Nytt
- `source-diversity.ts` mäter observerad täckning för källklass, geografi, signaltema och provenance.
- API:t exponerar `sourceDiversity` med coverage score, blind spots och rekommenderad exploration.
- Adaptive Source Crawl ger en begränsad exploration-bonus till källor som kan fylla observerade blind spots.
- Diversity påverkar exploration, inte source trust. En svag källa blir alltså inte trusted för att täckningen är låg.
- Republisher är inte en egen positiv diversitetssignal.
- Coverage gap betyder endast låg observerad källtäckning — inte att en verklig marknadshändelse saknas.

## Guardrails
- Ingen källa stängs av automatiskt.
- Trust och exploration hålls separata.
- Bonusen är begränsad och kan inte ensam göra en källa högkvalitativ.
- Nyhetskvalitet, artikelvalidering och provenance fortsätter avgöra vad som faktiskt får visas.

## Ej verifierat
- Full Next.js production build
- live provider run / live crawl
- Neon-migrationer
- deploy
