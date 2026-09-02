## Aktuell release: v1.9.0

Aktörswatchlist med tidslinje, temaförflyttningar och bevaka-härnäst.

# Bevakly v1.2.0

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
Avfallsprofilen använder nu 19 bevakade källingångar. Nya ingångar breddar bevakningen mot energi/priser, officiell statistik, VA/slam och EU:s cirkulära ekonomi. Flera sidor från samma domän behandlas inte som oberoende bekräftelse.
