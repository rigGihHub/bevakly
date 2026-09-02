# Bevakly v0.7.0

## Nytt
- Konkurrentprofiler byggda från verklig historik: aktivitet 30/120 dagar, momentum, snittscore, kategorier, geografi och tidslinje.
- Experimentell motor för **svaga signaler**. Den kombinerar små separata händelser för att hitta möjliga kapacitetsuppbyggnader och lokala skiften i konkurrensbilden.
- Varje svag signal visar **vad som talar för hypotesen, vad man bör bevaka för bekräftelse och vad som talar emot**. Det minskar risken för att spekulation presenteras som analys.
- Två nya API-routes: `/api/competitor-profiles` och `/api/weak-signals`.

## Produktprincip
Svaga signaler är hypoteser, inte prognoser eller verifierad fakta. Om historiken inte räcker ska Bevakly hellre visa ett tomt läge än skapa en signal.
