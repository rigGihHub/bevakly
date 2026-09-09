## Senaste lokala release: v2.77.0 – Source Yield Prioritization

Adaptive Source Crawl väger nu inte bara teknisk stabilitet och mängden nya kandidater, utan även hur ofta en källa faktiskt levererar **A/B-nyheter** enligt Bid News Relevance. Källor som bevisat hög affärsnytta får större kandidatbudget. Explore-lanen är fortsatt skyddad och ingen källa stängs av automatiskt.

## Senaste lokala release: v2.76.0 – Bid News Relevance Calibration

För avfallsprofilen rankas nu nyheter efter konkret arbetsvärde för marknads- och anbudsarbete. Kontrakt/tilldelningar, behandlingskapacitet, tillstånd, etableringar, förvärv, investeringar samt pris-/materialflöden går före generella hållbarhets-, teknik- och kommunikationsnyheter.

## Senaste lokala release: v2.75.0 – Source Article Validation

Bevakly validerar nu att rubrik, URL, publiceringsdatum och extraherad brödtext faktiskt hör ihop innan en träff får behandlas som artikel. Kategori-, arkiv-, tagg- och söksidor kan stoppas, tydliga datumkonflikter flaggas och osäkra artiklar viktas ned.

## Senaste lokala release: v2.74.0 – Fresh Event Detection

Bevakly skiljer nu mellan **ny utveckling**, **pågående utveckling**, **bakgrund/återpublicerad information** och **osäker freshness**. Modellen är avsiktligt konservativ: den straffar bara tydliga bakgrundsfall och påstår aldrig ett exakt händelsedatum om källan inte själv anger det.

Detta gör att “publicerad idag” inte automatiskt behandlas som “något nytt hände idag”.

## Senaste lokala release: v2.73.0 – Story Provenance & Event Dedupe

Nyhetsflödet prioriterar nu **en händelse framför många länkar om samma händelse**. Bevakly klassar direkt organisations-/myndighetskälla, möjlig oberoende redaktionell rapportering och press-/distributionsplattform separat. När samma händelse finns på flera ställen väljs den bästa primärkällan och övriga räknas som källor/bekräftelser i stället för separata nyheter.

## Senaste lokala release: v2.72.0 – News Quality Gate

Fokus är nu **rätt nyheter före fler nyheter**. En ny kvalitetsgrind bedömer faktisk ämnesrelevans, titelrelevans, strategisk förändringssignal, artikelutvinning och kontext innan en fast källträff får nå flödet. Svaga service-/navigationssidor stoppas. Relevant men tunt underlag får lägre vikt.

Dessutom prioriterar `factualSummary` nu faktisk extraherad artikeltext framför en kort metabeskrivning.

## Senaste lokala release: v2.71.0 – Analyst Action Queue

Intelligence Priority blir nu en konkret analytikerarbetskö: **Granska nu**, **Sök kompletterande evidens**, **Följ beslut**, **Verifiera källa**, **Bevaka** eller **Kan vänta**. Kön utför inga externa åtgärder automatiskt och ändrar inte signalens fakta- eller tolkningssäkerhet.

## Senaste lokala release: v2.70.0 – Intelligence Priority Engine

Bevakly prioriterar nu robusta förändringscase efter vad användaren bör granska först. Modellen väger ihop signalstyrka/attention, bedömd affärspåverkan, beviskedjans täckning, förändringsmomentum och aktualitet. Persistent cooling påverkar attention-delen innan prioriteringen räknas.

**Prioritet är inte sannolikhet.** Låg tolkningssäkerhet begränsar maximal prioritet och nivån Kritisk kräver både hög tolkningssäkerhet och hög bedömd påverkan.

## Senaste lokala release: v2.69.0 – Negative Evidence & Cooling Engine

Bevakly kan nu försiktigt kyla ned ett case när samma högprioriterade bevislucka faktiskt har bestått genom sparad case-historik över tid. Utebliven bekräftelse behandlas uttryckligen **inte** som bevis mot hypotesen. Nedkylningen påverkar ett separat attention score, inte faktasäkerheten.

Samtidigt har Case History fått material-snapshot-deduplicering: en vanlig refresh utan materiell förändring skapar inte längre ett nytt evolutionssteg.

## Senaste lokala release: v2.68.0 – Evidence Promotion Loop

Gap-driven discovery kan nu lämna efter sig väntande evidens som sparas separat och först i en senare analyscykel får kvalificeras för ordinarie fusion. Därmed sluts kedjan signal → gap → riktad sökning → väntande evidens → ny fusion utan att samma request får självförstärka sin egen hypotes.

Aktivering kräver manuell granskning/körning av `MIGRATION-v2.68.0-evidence-promotion.sql` och därefter `BEVAKLY_EVIDENCE_PROMOTION_ENABLED=true`.

## Senaste lokala release: v2.67.0 – Persistent Learning State foundation

Discovery-feedback kan nu hydras från och sparas till Neon via en separat feature flag. Databaslärandet läses in **före** gap-query-rankingen, så att prioritering kan överleva cold starts när schema och flagga är aktiverade. Om persistence inte är redo faller systemet tillbaka till processminne.

Aktivering kräver manuell granskning/körning av `MIGRATION-v2.67.0-persistent-discovery-learning.sql` och därefter `BEVAKLY_DISCOVERY_LEARNING_ENABLED=true`.

## Senaste lokala release: v2.66.0 – Discovery Feedback Loop

Gap-drivna sökningar mäts nu på faktisk yield, faktasäkerhet och starka discovery-träffar. Historiken används endast för att prioritera ordningen inom samma fasta budget. Inget sökmönster stängs automatiskt av, och nya/obeprövade mönster behåller exploration.

## Senaste lokala release: v2.65.0 – Gap-Driven Discovery

Högprioriterade source gaps skapar nu ett separat, hårt budgeterat andra discovery-pass. Träffarna visas direkt som kompletterande discovery men påverkar inte samma körnings fusion förrän de passerat ordinarie kvalitetsflöde i nästa analyscykel.

## Senaste lokala release: v2.64.0 – Source Gap Detection

Bevakly identifierar nu vilka centrala bevisområden som saknas för varje robust förändringshypotes och föreslår nästa bästa sökning. Det minskar risken att systemet nöjer sig med en stark men ofullständig berättelse.

## Senaste lokala release: v2.63.0 – Why It Matters Engine

Varje robust förändringskedja får nu en regelbaserad konsekvensanalys med tre separata perspektiv: marknad, konkurrent och egen bevakning. Fakta hålls visuellt och logiskt separerat från Bevaklys bedömning.

## Senaste lokala release: v2.62.0 – Case Evolution Engine

Visar hur ett case utvecklats över sparade snapshots: score, fakta, process-steg, riktning och nya källtyper. Om persistent case history inte är aktiv visas endast aktuell observation och ingen falsk historik skapas.

## Senaste lokala release: v2.61.0 – Persistent Case History foundation

Stabila case-snapshots och separat DB-adapter/migration för firstObservedAt, lastObservedAt, score/stage/direction/fact history. DB-skrivning är avstängd som standard och kräver både migration + `BEVAKLY_CASE_HISTORY_ENABLED=true`.

## Senaste lokala release: v2.60.0 – Intelligence Lead-Time Score

Mäter observerad ledtid inom aktuell beviskedja: första klassade tidiga signal → senare nyhet, beslut eller genomförande. Visar snitt, antal mätbara kedjor, väntande bekräftelser och bästa observerade försprång. Detta är inte historisk produkt-detection-time innan persistent first-seen är verifierad.

## Senaste lokala release: v2.59.0 – Bevakly Daily Intelligence Brief

Ny kompakt beslutsbrief: tre viktigaste förändringar, stärkta signaler, konkurrent att bevaka, dagens nästa kontroller och följda historier som kräver uppmärksamhet. Tomt underlag ger en ärlig tom brief i stället för utfyllnad.

## Senaste lokala release: v2.58.0 – Ask Bevakly

Ny källgrundad frågevy över Signal Timeline och lokalt följda förändringar. Svar byggs deterministiskt från Bevaklys eget underlag och visar källor/limitations; ingen fri AI-gissning används.

## Senaste lokala release: v2.57.0 – Följ denna förändring

Användaren kan nu följa en förändringssignal. Bevakly sparar senaste kända score, faktamängd och process-steg lokalt och jämför mot kommande feed-körningar för status Stärks, Stabil, Försvagas eller Ingen ny träff.

## Senaste lokala release: v2.56.0 – Entity & Relationship Graph

Aktuella observationer kopplas nu mellan organisation, geografi, signaltyp och källa. Konkurrentnamn normaliseras via explicit aliasregistry och Signal Fusion har anti-bridge-skydd mellan olika konkurrenter i samma geografi.

## Senaste lokala release: v2.55.0 – Competitor Website Change Detection

Verifierade konkurrentwebbplatser får snapshots och before/after-diff. Första observationen är baseline, aldrig en påstådd förändring. State är processlokalt tills persistence verifierats.

## Senaste lokala release: v2.54.0 – Konkurrentkort 2.0

Konkurrentspåret samlar nu aktuella jobbannonser, fusionerade förändringssignaler, formella processer och beviskedjor per bevakad aktör.

## Senaste lokala release: v2.53.0 – Vad håller på att hända?

Huvudflödet visar nu förändringar före rå nyhetsvolym: viktigaste förändringar, stärkta signaler, konkurrentfokus och öppningsbar beviskedja.

## Senaste lokala release: v2.52.0 – Signal Timeline & Escalation

Fusionerade signaler får nu kronologiska milstolpar, process-steg, eskaleringspoäng och riktning. Cross-run persistence markeras som ej verifierad tills production-databasen är verifierad.

## Senaste lokala release

**v2.51.0 – Signal Fusion** – korskopplar jobbannonser, kommunprotokoll, offentliga register och nyhets-/authority-discovery till försiktiga förändringshypoteser med separat fakta- och tolkningssäkerhet.

Senaste lokala release: v2.50.0 – Public Records Intelligence + Competitor Job Radar

## Aktuell release: v1.9.0

Aktörswatchlist med tidslinje, temaförflyttningar och bevaka-härnäst.

# Bevakly

Senaste lokala release: **v2.45.0 – Article Extraction Recovery** v1.2.0

Bevakly är ett system för strategisk omvärldsbevakning och konkurrentintelligence. Första branschprofilen är svensk avfalls- och återvinningsmarknad.

## Produktprincip
**Få men relevanta insikter.** Bevakly ska hjälpa användaren förstå vad som förändras, varför det spelar roll och vad som bör bevakas härnäst.

Bevakly analyserar omvärlden. Upphandlings- och anbudsarbetet hör hemma i Anbudify.

## v1.2
- Executive Brief
- Strategic Impact
- Trend Intelligence
- Blind Spots
- Weak Signals
- Avfalls-taxonomi v1
- källoberoende evidensbedömning
- Belief Shifts: vad Bevakly ändrade uppfattning om
- automatisk upptäckt av återkommande nya teman

## Avfalls-taxonomi v1
Insamling & logistik; Sortering & materialåtervinning; Matavfall & biologisk behandling; Energiåtervinning; Farligt avfall; Cirkularitet & återbruk; Regelverk & producentansvar; Klimat & fossilfri drift; Digitalisering & data; Kapacitet & infrastruktur; Kostnad & marknadsekonomi; Förvärv & konsolidering.

## Neon / historik

Bevakly v2.2.0 använder Neon/PostgreSQL för server-side historik. Lägg den poolade anslutningssträngen i `DATABASE_URL` och kör `bevakly-neon-schema.sql` i Bevakly-projektets `neondb`. `BEVAKLY_ORGANIZATION_ID` är valfri; om den saknas används den seedade standardorganisationen.

## v1.3 – Branschflöde och multi-industry
Bevakly kan nu startas med olika branschprofiler. Branschflödet visar daterade relevanta nyheter för de senaste 24 timmarna, 3, 7 eller 30 dagarna och filtrerar på nyhetskategori. Avfall & återvinning har fortsatt den mest detaljerade intelligence-modellen; övriga profiler använder en generell modell tills deras taxonomier fördjupas.

Contradiction Engine markerar när historiken innehåller signaler som pekar i motsatta riktningar. Den funktionen ska minska risken att Bevakly förstärker en hypotes bara för att den första evidensen råkade vara ensidig.


## v1.4 – Source Network
Branschflödet använder ett strukturerat källnät med källtyp, geografisk räckvidd, kvalitetsnivå, källhälsa och oberoende domänräkning. Avfallsprofilen har breddats med svenska, europeiska och internationella källor.


## v1.5 – Source Discovery
Bevakly kan nu upptäcka nya potentiellt relevanta källor som återkommande refereras i det befintliga källnätet. Förslagen poängsätts och visas för granskning men läggs aldrig till automatiskt.

## v1.6 – personlig relevans
Branschflödet kan nu lära sig av användarens direkta signaler: **Viktigt**, **Ointressant** och **Följ detta**. Modellen påverkar ordningen i vyn *För dig* genom kategori, källa, geografi och återkommande ämnesord. *Senaste* finns kvar som helt kronologisk vy.

Personalisering får inte undertrycka starka blind spots: händelser med hög grundscore, flera oberoende källor eller officiella regelverk har ett skyddsgolv. I v1.6 lagras personliga reaktioner lokalt i webbläsaren tills användar-/organisationskopplad persistence aktiveras.

## v1.7 – Morning Brief / Nytt sedan sist
När användaren återkommer visar Bevakly vad som har publicerats sedan föregående besök i vald branschprofil. Första besöket använder 24 timmar och därefter sparas besökspunkten lokalt. Briefen visar högst fem prioriterade händelser och väger ihop grundrelevans, personlig relevans, oberoende källstöd och skyddade signaler. Branschflödet kan fortfarande växlas mellan senaste 24 timmarna, 3, 7 och 30 dagar.


## v1.8.0 – Bevakningsprofiler
Flera parallella bevakningar med egna branscher, geografier, aktörer och teman. Profiler lagras lokalt och får separata Morning Briefs samt separat personlig relevans.

## v2.0 — Actor Comparison
Profiler med minst två aktörer får nu en jämförelsevy för observerad aktivitet, momentum, källbredd, teman och geografier. Funktionen ska läsas som source intelligence — inte som marknadsandel eller prestationsranking.


## v2.1 Strategic Moves
Bevakly kan nu kombinera separata aktörshändelser till försiktigt formulerade strategiska hypoteser. Varje hypotes visar stöd, källbredd, motbevis och vad som bör bevakas härnäst. Funktionen beskriver observerade mönster och får inte presentera dem som verifierad företagsstrategi.

## Automatisk insamling (v2.3.0)

Vercel kör `/api/source-preview` automatiskt en gång per dygn via `vercel.json`. Körningen hämtar källor, analyserar träffar och sparar historiken i Neon. På Vercel Hobby är cron begränsad till daglig körning, därför är standarden 05:30 UTC. Manuell körning av endpointen behövs bara vid felsökning eller om du uttryckligen vill tvinga fram en extra insamling.


## v2.5.0 – Förklaringslager
Varje händelse i Branschflödet får nu en enkel, deterministisk förklaring av varför den kan vara viktig och vad användaren bör bevaka härnäst. Förklaringen hålls separat från fakta från källan och anger när signalen fortfarande är preliminär.

## v2.6.0 — Viktigast just nu
Branschflödet kan nu gruppera flera närliggande träffar till en försiktig story-klusterinsikt. Syftet är färre upprepningar och tydligare källstöd, utan att påstå att två artiklar är samma händelse när detta inte kan beläggas.


## v2.7.0 — Vad är faktiskt nytt?
Bevakly jämför nya händelser med liknande äldre rapportering och försöker skilja en ny artikel från en verklig ny utveckling eller konkret ny detalj.


## v2.8.0
Branschflödet innehåller nu **Utveckling över tid**, som försiktigt kopplar ihop återkommande signaler till strategiska tidslinjer.


## v2.10.0 – Daily Flow
Läst-status per bevakningsprofil, oläst-först, markera vy som läst och tydligt “Du är ikapp” för snabb daglig användning.


## v2.11.0 Source Network Expansion
Avfallsprofilen använder nu 31 bevakade källingångar. Nya ingångar breddar bevakningen mot energi/priser, officiell statistik, VA/slam och EU:s cirkulära ekonomi. Flera sidor från samma domän behandlas inte som oberoende bekräftelse.

- v2.13.0: Branschpuls med Marknaden just nu och ett kompakt Senaste från omvärlden.

- v2.14.0: Lokal radar med 10 regionala SVT-redaktioner och regionala avfallsaktörer Vafabmiljö/Renova. Lokala träffar filtreras på branschord innan artikelhämtning.

## v2.16.0
Lokal signalmotor: Länsstyrelseflöden och tidig klassificering av tillstånd, beslut, etableringar, investeringar, kapacitet, mark/bygglov, tillsyn och rekrytering. Branschvyn har en särskild Lokal signalradar.

## v2.17.0
Konkurrenternas förändringsbild jämför senaste 30 dagar med föregående period, visar stödjande händelser och motbevis och håller observerade mönster isär från verifierad strategi.

## v2.88 – persistent ambiguous candidates
Ambigua case-relationer kan nu sparas som observationsminne bakom `BEVAKLY_AMBIGUOUS_CANDIDATES_ENABLED=true`. Kör och granska först `MIGRATION-v2.88.0-persistent-ambiguous-candidates.sql`. Kandidaterna förblir karantänlagrade med `allowConfidenceImpact=false`; v2.88 laddar inte tillbaka dem i fusion och gör ingen automatisk promotion.
