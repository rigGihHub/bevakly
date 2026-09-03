# Bevakly v2.18.0 – Källvärde + rikstäckande miljöprövningsradar

## Nytt
- Ny deterministisk Källvärde-modell för varje källa.
- Källvärdet väger samman om källan svarar, antal relevanta kandidater, hur ofta den blev primär träff och hur ofta den bidrog till fler-källestöd.
- UI visar Hög / Medel / Under observation med konkret förklaring.
- Ingen källa tas bort automatiskt; modellen saknar ännu full statistik över allt bortfiltrerat brus.
- Källnätet breddas med samtliga länsstyrelser som hyser Sveriges tolv miljöprövningsdelegationer (MPD).
- MPD-nätet täcker tillsammans hela Sverige och kan ge tidiga signaler om nya/ändrade miljötillstånd, avfallsanläggningar, deponier, kapacitet och andra miljöfarliga verksamheter.

## Produktprincip
Bevakly ska inte maximera antal källor. Bevakly ska veta vilka källor som faktiskt tillför signalvärde och samtidigt behålla officiella lokala källor som kan vara tysta länge men mycket värdefulla när något händer.

## Begränsning
Denna release verifierar källornas relevans och officiella MPD-struktur, men ingen full live-körning mot samtliga externa sidor eller full Next.js-build har gjorts i releasepaketet.
