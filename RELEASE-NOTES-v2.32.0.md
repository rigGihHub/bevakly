# Bevakly v2.32.0 – Discovery Result Pipeline

## Nytt
När en framtida sökprovider returnerar råa träffar finns nu hela kvalitetskedjan efter providern.

### Pipeline
1. URL canonicalization
   - tar bort trackingparametrar
   - normaliserar domän/path/query
2. Datumkontroll
   - kräver tolkningsbart publiceringsdatum
   - stoppar framtida eller för gamla träffar
3. Relevansfilter
   - branschbegrepp eller tydlig Early Signal krävs
4. Early Signal
   - tillstånd, samråd, plan/mark, etablering, kapacitet, rekrytering, investering, myndighetsärende
5. Entiteter
   - geografi
   - bevakade konkurrenter
6. Kvalitetspoäng
   - myndighetskällor får högre faktatrovärdighet
   - Early Signal och konkret branschmatchning höjer prioritet
7. Deduplicering
   - först canonical URL
   - därefter konservativ titel + datum
8. Evidens
   - använder samma Evidence Quality-motor som övriga Bevakly

## Viktig gräns
Ingen extern sökprovider är ansluten i v2.32. API:t rapporterar därför uttryckligen `providerConnected:false`. Det som är klart är hela kedjan från ett providersvar till accepterad eller avvisad Bevakly-signal.

## Varför
Det minskar risken att en framtida bredare discovery-plattform fyller Bevakly med brus. Sökbredd får inte sänka bevis- eller relevanskraven.
