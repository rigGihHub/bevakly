# Bevakly v2.56.0 – Entity & Relationship Graph

## Nytt
- Explicit canonicalisering av konkurrentnamn och alias.
- Entity Graph med observerade noder för organisation, geografi, signaltyp och källa.
- Relationer räknas och tidsstämplas per aktuell observation.
- Konkurrentkort visar observerade geografier, signaltyper och källor.
- REMONDIS normaliseras konsekvent oavsett versalisering.
- Signal Fusion använder canonicaliserade konkurrentnamn.

## Correctness
- Anti-bridge-regel: om två signaler namnger olika konkurrenter kan gemensam geografi inte ensam slå ihop dem.
- Geografi-only-fusion tillåts bara när ingen av signalerna namnger en konkurrent.
- Dotterbolag, anläggningar och ägarrelationer gissas inte. Sådana relationer måste komma från faktiskt underlag innan de kan läggas in i grafen.

## Begränsning
Grafen byggs av aktuell discovery-körning. Persistent graph-state är inte verifierad.

## Bugfix
- Konkurrentkortets jobbklassning använder nu API:ts verkliga `signalStrength`-fält i stället för ett icke-existerande `label`-fält.
