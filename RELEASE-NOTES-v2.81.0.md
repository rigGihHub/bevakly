# Bevakly v2.81.0 — Hard Negative Expansion

## Varför
Efter v2.80 var nästa risk falska positiva som ser affärskritiska ut på nyckelord men egentligen är referensmaterial, opinion, event, historik eller generell analys.

## Nytt
- 38-case Hard Negative Benchmark.
- Starkare kontextkontroll för referens-/opinion-/eventinnehåll.
- Separat hantering av spekulation/önskemål kontra verifierad förändring.
- Prisord ger inte längre strategisk nivå utan konkret pris-/kostnadsförändring.
- Miljöprövning/tillståndsord ger inte längre extra direct-regulation-bonus utan faktisk process-/beslutssignal.
- Negationslogik skärpt per tema.
- Svensk regex-guardrail: ordgränser förhindrar att exempelvis `Vingåker` feltolkas som `inga`.
- Historisk berättelse (`så byggdes`, jubileum, historik) kan klassas som resurfaced när äldre händelseår dominerar.

## Viktig produktprincip
Jobbannonser och policyförslag ska inte automatiskt tryckas ned. En jobbannons som faktiskt pekar på en ny anläggning eller ett konkret regelutredningsförslag kan fortfarande vara en relevant early-warning-signal.

## QA
- v2.81 hard negatives: 38/38 PASS
- v2.80 real-news golden set: 20/20 PASS
- v2.79 synthetic precision set: 60/60 PASS
- Totalt låsta scenarier i de tre sviterna: 118

Detta bevisar regressionstäckning för fixtures, inte perfekt liveprecision.
