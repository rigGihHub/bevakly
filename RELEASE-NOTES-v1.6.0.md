# Bevakly v1.6.0 – Personal Relevance

## Nytt
- **För dig / Senaste** i Branschflödet.
- Direkt feedback per händelse: **Viktigt**, **Ointressant**, **Följ detta**.
- Personlig relevansmodell som lär från kategori, källa, källgeografi, händelsegeografi och återkommande rubrikämnen.
- Reaktioner får recency decay så gamla preferenser väger mindre över tid.
- Transparent score: visar personlig justering och varför en händelse flyttats upp eller ned.
- **Protected signals**: hög grundrelevans, flera oberoende källor och officiellt regelverk får inte filtreras bort av personlig feedback.
- Nollställning av personlig inlärning.
- Personlig feedback sparas lokalt per bransch i webbläsaren i denna release.

## Produktregel
Personalisering ska prioritera uppmärksamhet – inte förändra fakta, källstöd eller Bevaklys sakbedömning. Kritiska blind spots ska fortsatt kunna bryta igenom en användares normala preferenser.

## Verifiering
- Personal relevance-kärnan separat TypeScript-kompilerad.
- Smoke-test för positiv inlärning, negativ inlärning och protected-signal-golv.
- Ändrad TSX parser/transpile-kontrollerad.
- ZIP-integritet kontrollerad.
- Full `next build` är inte verifierad i arbetsmiljön om npm-beroenden saknas.
