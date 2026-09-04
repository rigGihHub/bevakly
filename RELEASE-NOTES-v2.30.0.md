# Bevakly v2.30.0 – Authority & Municipality Discovery Plan

## Nytt
- Bevakly har nu en strukturerad discovery-plan för avfallsmarknaden.
- Alla 290 svenska kommuner blir separata discovery-mål.
- Sveriges länsstyrelseområden blir regionala myndighetsmål.
- Nationella myndighetsmål ingår.
- Varje mål får specifika sökintentioner för tillstånd, samråd, plan/mark, kapacitet, etablering och tillsyn.
- Sökhints kan senare användas av en aktiv crawler/search-adapter utan att vi behöver hårdkoda falska kommun-URL:er.
- API:t rapporterar faktisk discovery-täckning och vilka mål som ännu saknar direkt aktiv källa.
- En kompakt UI-rad visar hur mycket av discovery-ytan som redan är direkt kopplad.

## Viktiga stabilitetsfixar
- Om Neon-persistens misslyckas returneras nu `enabled:false`, så webbläsarens lokala historikfallback kan fungera som avsett.
- Source Learning deduplicerar historiska källkörningar till högst en observation per källa och dag innan inlärningen räknas. Upprepade sidrefreshar ska därför inte längre väga lika tungt som nya dagar.

## Begränsning
v2.30 skapar den systematiska sökytan och täckningsmodellen. Den gör ännu inte 290 separata nätverksanrop per körning. Nästa steg är adapterlagret som kan koppla discovery-mål till faktiska kommunala/länsstyrelse-sök- eller listningssidor utan att överbelasta körningen.
