# Bevakly v1.2.0 — Intelligence Quality

v1.2 förbättrar kvaliteten i Bevaklys slutsatser i stället för att lägga till ännu en radar.

## Nytt
- Avfalls-taxonomi v1 med 12 strategiska branschteman.
- Trend Intelligence kan nu följa branschteman, inte bara generiska kategorier, konkurrenter och geografi.
- Källoberoende bekräftelse: flera artiklar från samma domän räknas inte som flera oberoende källor.
- Strategic Impact får lägre säkerhet om ett mönster saknar oberoende källstöd.
- Belief Shifts: "Vad ändrade Bevakly uppfattning om?" jämför senaste 30 dagar med föregående 30 dagar.
- Automatisk temaupptäckt fångar återkommande begrepp som ännu inte finns i den etablerade taxonomin.
- Intelligence Quality-rad i UI visar vilken taxonomi och bekräftelseregel som används.

## Produktgräns
Bevakly analyserar omvärld, marknad och strategiska förändringar. Upphandlings- och anbudsarbetet hör hemma i Anbudify.

## Säkerhetsprincip
En hög mängd träffar är inte i sig stark evidens. Källoberoende, historisk förändring och motsägande data ska väga tyngre än ren artikelvolym.

## Verifiering
Kärnmoduler smoke-testas separat. Full Next.js-build ska endast beskrivas som verifierad om beroenden finns installerade och `next build` faktiskt har körts.
