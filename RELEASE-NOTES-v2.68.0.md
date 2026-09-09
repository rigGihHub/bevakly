# Bevakly v2.68.0 – Evidence Promotion Loop

## Nytt
- Ny `lib/intelligence/evidence-promotion.ts`.
- Ny serveradapter `lib/server/evidence-promotion.ts`.
- Ny migration `MIGRATION-v2.68.0-evidence-promotion.sql`.
- Ny feature flag:
  - `BEVAKLY_EVIDENCE_PROMOTION_ENABLED=true`

## Flöde
1. Ett robust case får ett source gap.
2. Gap-Driven Discovery gör en riktad sökning.
3. Accepterade gap-träffar sparas som `pending`.
4. Samma request får **inte** använda dessa träffar i sin fusion.
5. Vid en senare request laddas tidigare pending evidens.
6. Evidensen kvalificeras på:
   - giltig URL/titel
   - giltigt datum
   - max 180 dagars publiceringsålder
   - minst Medel faktasäkerhet
   - discovery score minst 55
   - minst konkurrent- eller geografikoppling
7. Godkänd evidens får delta i ordinarie fusion.
8. Om den faktiskt stärker en befintlig förändringskedja kan nästa source-gap-analys därefter visa bättre täckning eller ett stängt gap.

## Anti-loop guardrail
Cutoff sätts till requestens `fetchedAt`.
`loadPendingEvidenceBefore(fetchedAt)` läser endast poster med:
`discovered_at < fetchedAt`.

Dagens gap-träffar sparas först senare med exakt dagens `fetchedAt`.
De kan därför aldrig läsas tillbaka och förstärka samma analyscykel.

## Promotion betyder inte bekräftelse
Promotion betyder endast att ett tidigare accepterat discovery-resultat får delta i samma fusionmotor som övrig evidens.
Fusionens ordinarie krav på flera källklasser, oberoende källor, geografi/konkurrent och tidsmässig korrelation gäller fortfarande.

## Persistence
Migrationen skapar `intelligence_pending_evidence` med status:
- `pending`
- `promoted`
- `rejected`

Sparar bland annat:
- gap-id
- ursprunglig timeline-id
- source class
- titel/URL/källa
- publiceringsdatum
- konkurrenter/geografi
- fact/interpretation confidence
- discovery score
- discovered/promoted/rejected timestamps

## Guardrails
- Feature-gated.
- Schema probe före read/write.
- Databasfel får inte bryta feeden.
- Dubblett mot aktuell active discovery filtreras innan promoted input läggs till.
- Låg faktasäkerhet hålls utanför fusion.
- Svagt score hålls utanför fusion.
- Evidens utan entity/geografi hålls utanför automatisk promotion.
- Migrationen påstås inte vara körd i produktion.

## Inte verifierat
- Full Next.js-build.
- Live provider-körning.
- Att migrationen är körd i Neon.
- Evidence promotion i produktion.
- Deploy.
