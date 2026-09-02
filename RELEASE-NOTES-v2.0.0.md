# Bevakly v2.0.0 — Actor Comparison

## Nytt
- Jämför 2–4 aktörer sida vid sida från den aktiva bevakningsprofilen.
- Aktivitet senaste 30/90 dagar, momentum, oberoende källdomäner och källbredd.
- Tyngsta observerade tema och geografi per aktör.
- Temakarta som jämför senaste 30 dagar mot föregående 30 dagar.
- Identifierar när en aktör ensam accelererar inom ett tema.
- Sammanfattar observerade skillnader i stället för att utse en förenklad vinnare.
- Tydliga varningar för publiceringsbias och tunt underlag.

## Produktprincip
Actor Comparison mäter endast vad Bevakly observerar i sitt källnät. Högre synlighet är inte samma sak som större marknadsaktivitet, marknadsandel eller bättre prestation.

## Teknisk ändring
- `lib/intelligence/actor-comparison.ts`
- `/api/actor-comparison`
- `components/ActorComparison.tsx`
- integrerat i dashboarden för profiler med minst två bevakade aktörer.
