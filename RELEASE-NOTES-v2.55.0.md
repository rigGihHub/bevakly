# Bevakly v2.55.0 – Competitor Website Change Detection

- 10 explicit verifierade sidor: homepage + careers för PreZero, Ragn-Sells, Stena Recycling, REMONDIS och Verdis.
- Första hämtningen skapar baseline och genererar ingen falsk förändring.
- SHA-256-fingeravtryck och normaliserad textdiff.
- Strategiska termförändringar: etablering, investering, kapacitet, förvärv, nya erbjudanden, nyckelrekryteringar och kommande uppdrag.
- Importance low/medium/high baserat på förändringsgrad + strategiska termskiften.
- Redirect måste stanna inom explicit allowlist.
- Max 6 sidor per feed-körning med daglig rotation.
- Konkurrentkort 2.0 visar upptäckta webbändringar separat från jobb och fusionerade slutsatser.
- State är processlokalt; cross-run persistence påstås inte vara verifierad.
