# Bevakly v2.95.0 – News Reach Expansion I

## Mål
Vidga nyhetsbevakningen utan att sänka kvalitetskraven.

## Förändringar
- 8 nya verifierade svenska/nordiska/EU-källor: SÖRAB, NSR, June Avfall & Miljö, Göteborg Kretslopp och vatten, Miljøstyrelsen Danmark, SSB Norge Avfall, NFFA Norge och European Circular Economy Stakeholder Platform.
- Separata `wasteDiscoveryKeywords` för intake. Rubriker kan nu fångas på strategiska ord som omlastning, kapacitet, upphandling, tilldelning, kontrakt, taxa och prisjustering även om ordet avfall saknas i rubriken.
- Quality Gate, Article Validation, Fresh Event Detection, Provenance och Bid News Relevance ligger fortfarande efter intake och avgör vad som får visas.
- Candidate extraction höjd från 20 till 36 per source adapter och från 18 till 32 i legacy link intake. Adaptive crawl kan därmed faktiskt utnyttja större candidate budgets.
- Source-specifika path guards för de nya källorna minskar service-/navigationsbrus.

## Guardrail
Bredare intake betyder fler kandidater, inte lägre publiceringströskel. `RÄTT NYHETER > FLER NYHETER` gäller fortsatt.

## QA
Kör `npm run qa:news-reach` samt tidigare news-quality-regressioner.
