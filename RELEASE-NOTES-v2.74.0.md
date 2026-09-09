# Bevakly v2.74.0 – Fresh Event Detection

## Syfte
Skilj publiceringsdatum från faktisk nyhetsmässig förändring.

## Klassning
- `new-development`
- `ongoing-development`
- `background-or-resurfaced`
- `uncertain`

## Signaler
Ny utveckling stärks av tydliga förändringsverb i rubrik, exempelvis:
- inviger / öppnar
- tecknar / vinner / tilldelas
- investerar / bygger / expanderar
- ansöker / beviljas / beslutar
- förvärvar / köper
- rekryterar / utser / tillträder
- startar / tar över / driftsätter

Bakgrund identifieras konservativt genom:
- uttryck som “tidigare”, “redan”, “sedan”
- äldre explicita årtal
- formuleringar som att något beslutades/startade/invigdes ett tidigare år
- frånvaro av tydlig ny förändringssignal i rubriken

## Score-justering
- tydlig ny utveckling: +6
- pågående utveckling: +2
- tydlig bakgrund/återpublicerad information: -10 till -16
- osäker: 0

## Guardrail
Fresh-event-klassningen:
- ändrar inte publiceringsdatum
- hittar inte på exakta händelsedatum
- använder inte pressdistribution som bevis för att händelsen är ny
- straffar inte osäkra fall bara för att de är osäkra

## Inte verifierat
- full Next.js production build
- live crawl av samtliga källor
- deploy
