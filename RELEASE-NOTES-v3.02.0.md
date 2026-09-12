# Bevakly v3.02.0 – Competitor News Desk

## Fokus
Fortsatt återcentrering på Bevaklys kärnuppgift: färska branschnyheter generellt och nyheter om bevakade konkurrenter i synnerhet.

## Viktig korrigering från v3.01
v3.01 hade en reserverad competitor-news discovery-lane, men den tydliga "Nyheter först"-ytan byggde i huvudsak sin konkurrentkolumn från det fasta källflödet. Det innebar att relevanta kvalitetsfiltrerade discovery-träffar kunde hittas men inte synas där användaren först letar efter konkurrentnyheter.

v3.02 rättar detta.

## Nytt
- Konkurrentnyheter grupperas per bevakad aktör: “Vad är nytt om PreZero?”, “Vad är nytt om Ragn-Sells?” osv.
- Fasta källor och kvalitetsfiltrerad discovery slås ihop i konkurrentdesken.
- URL-dedupe gör att samma artikel inte visas dubbelt bara för att den hittats både via fast källa och discovery.
- Vid exakt dubblett föredras den fasta källobservationen framför discovery-observationen.
- Varje träff får en neutral signaltyp: upphandling, tillstånd, anläggning/kapacitet, förvärv/ägande, rekrytering, pris/marknad eller övrigt.
- Källspåret märks tydligt som FAST KÄLLA eller DISCOVERY.
- Även generell branschnyhetsyta kan nu visa kvalitetsfiltrerad discovery, inte bara fasta källor.
- Bevakade bolag utan verifierade träffar visas uttryckligen som tomma i perioden; Bevakly fyller inte ut med svaga eller orelaterade resultat.

## Guardrails
- Konkurrentträff = observation, inte automatiskt strategi.
- Discovery måste redan ha passerat ordinarie quality/freshness/provenance/dedupe-filter innan den visas.
- Ett bolag utan verifierad nyhet får ingen fabricerad aktivitet.
- Källspår och signaltyp är presentation/klassificering och höjer inte evidence confidence.

## QA som faktiskt körts
- v3.02 Competitor News Desk: 7/7 PASS
- News Precision: 60 fixtures, 0 failures
- Real News Golden Set: 20/20 PASS
- Hard Negatives: 38/38 PASS
- False Negative Challenge: 32/32 PASS
- Procurement Reach: 9/9 PASS
- Regional Media: 21/21 län täckta i regional metadata
- Secrets-pattern scan: 0 träffar

## Build-status
Full Next.js-build är inte verifierad eftersom `node_modules` saknas i arbetsmiljön. Global `tsc --noEmit` kan därför inte resolve React/Next-typer och visar dessutom redan existerande typfel i bland annat industry-feed-routen. Build räknas inte som PASS.
