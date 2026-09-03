# Bevakly v2.24.0 – Competitor Baseline & Early Warning

## Nytt
- Branschflödet identifierar nu konkurrenter och sparar konkurrentkopplingen i Persistent Intelligence.
- Varje konkurrent jämförs mot sin egen 180-dagarshistorik.
- Baseline använder senaste 30 dagar mot föregående fem månaders genomsnitt.
- Early Warning väger ihop:
  - aktivitetsacceleration
  - nya geografier
  - nya kategorier/teman
  - flera samtidiga aktivitetstyper
  - stöd från separata källor
- Pressvolym ensam räcker inte för en tydlig varning.
- “Tydlig” kräver flera förändringstecken, minst tre aktuella händelser och minst två separata källor.
- Evidens visas direkt under varningen.

## Viktig korrigering
Historical Change räknar nu unika marknadshändelser i stället för att samma artikel som observerats vid flera dagliga körningar kan räknas flera gånger.

## Begränsning
Äldre observationer som sparades före v2.24 kan sakna konkurrentkoppling. Konkurrentbaselines blir därför starkare när nya körningar fyller på korrekt historik.
