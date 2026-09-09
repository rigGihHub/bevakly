# Bevakly v2.98.0 – Procurement & Award Reach Expansion

## Ändrat
- Ny explicit upphandlingslivscykel: planerad → RFI/marknadsdialog → annons → frågor/förtydliganden → tilldelning → överprövning → avtal → start, samt option/förlängning och avbruten upphandling.
- Discovery-vokabulären fångar nu fler affärssignaler före och efter själva annonsen.
- News Quality känner igen fler upphandlingshändelser utan att göra dem till bevis för vinnare, värde eller leverantörsbyte.
- Ny guardrail-baserad `assessProcurementLifecycle`: okänd fas lämnas okänd i stället för att gissas.
- Ny QA för nio livscykelfall plus negativt fall och discovery-regression.

## Avsiktlig begränsning
Denna release förbättrar klassning/intake och case-underlag. Den påstår inte att externa upphandlingsportaler har full live-täckning eller att alla tilldelningsdokument kan hämtas. Det kräver separat verifiering av crawl health/yield.
