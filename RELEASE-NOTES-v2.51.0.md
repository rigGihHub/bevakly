# Bevakly v2.51.0 – Signal Fusion

## Fokus
Bevakly ska förstå när flera svaga, oberoende observationer sannolikt beskriver samma marknadsförändring.

## Nytt
- Ny `signal-fusion.ts` som kopplar ihop discovery-signaler över ett 45-dagarsfönster.
- Källklasser: news, municipal, jobs, environmental, competition, planning, legal, authority.
- Fusion kräver minst två olika källklasser och två distinkta källor.
- Hög tolkning kräver minst tre källklasser + tre distinkta källor samt gemensam konkurrent/geografi.
- En ensam jobbannons kan aldrig skapa en strategisk fusion.
- Hypoteser: expansion, anläggning/kapacitet, kontrakt/marknad, regulatoriskt/juridiskt, generell marknadsförändring.
- Varje fusion innehåller FAKTA-källor, separat faktasäkerhet/tolkningssäkerhet, skäl och "Bevaka härnäst".
- API exponerar `fusedSignals` separat från råa discovery-resultat.

## Begränsning
Fusion är heuristisk och processlokal. Den är inte persistent historik och ska presenteras som "BEVAKLY BEDÖMER", aldrig som ett verifierat faktapåstående.
