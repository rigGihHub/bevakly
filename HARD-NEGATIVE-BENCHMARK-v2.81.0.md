# Bevakly v2.81 — Hard Negative Benchmark

Syftet är att skydda precisionen mot innehåll som innehåller starka affärsord men inte beskriver en faktisk marknadsförändring.

Benchmarken innehåller 38 negativa fixtures inom bland annat:
- guider, mallar, FAQ och utbildning
- debatt, scenarier och spekulation
- konferenser och webbinarier
- historiska återpubliceringar
- generella pris-/kostnadsförklaringar
- jobbannonser utan separat verifierad marknadshändelse
- forsknings-/analysmaterial utan beslut
- kartor, statistik, index, arkiv, kategorier och söksidor

Två ursprungliga kandidatfall togs uttryckligen bort från negativsviten eftersom de kan vara legitima early-warning-signaler:
- jobbannons kopplad till uttryckligen ny återvinningsanläggning
- konkret utredningsförslag om ändrade avfallsregler

Guardrail: benchmarken får inte förbättras genom att träna bort värdefulla tidiga signaler.
