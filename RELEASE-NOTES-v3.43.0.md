# Bevakly v3.43.0

Fixar de sju punkterna från användargranskningen av v3.41.0.

- Uppdateringsdatum hålls isär från publiceringsdatum. Informationssidor, tidningspresentationer och nyhetslistor stoppas i artikelkontrollen och det gemensamma nyhetsflödet.
- Ohlssons daterade artikel direkt på nyhetssidan behålls. Artikeltexten isoleras från listan över äldre artiklar.
- Analysen kräver belägg i rubrik eller sammanfattning för den beskrivna förändringen. Varumärkesnamn och upstream-etiketter räcker inte. Utbildning, användningstips och kundcase får egna etiketter.
- Marknad, geografier och teman används i huvudflödet. Bevakade aktörer och nationella/EU-regler får tydliga undantagsförklaringar. Okänd geografi markeras och antas inte vara lokal.
- Konkurrenter visar direktkällornas status, artikelförsök och läsfel. Noll träffar beskrivs som resultatet av denna hämtning och innebär inte att inget har hänt.
- Laddningsläget visar förfluten tid utan ett samtidigt besked om inga nyheter. Tidigare resultat ligger kvar under manuell uppdatering och fel ger ett nytt försök. Sena svar från tidigare profiler ignoreras.
- Den extra briefen och snabböversikten är borttagna från startsidan. Kort visas direkt och fler kan öppnas. Tekniska tidsmått ligger efter flödet.
- Onboardingteman kan väljas, väljas bort och sparas. AI/Workspace visar det aktuella spårets profil i sidhuvudet.

## Verifiering

- 52 QA-skript inklusive nya regressioner för användargranskning och första renderingen: godkända.
- 3 QA-testfiler för website monitor och competitor signal lanes: godkända.
- `tsc --noEmit`: godkänd.
- `next build`: godkänd.
- De 20 real-news golden-fixturerna och 60 precision-fixturerna passerar. Detta är testdata, inte ett mått på liveflödets precision.
- Den separata webbläsaren blockerar localhost. Livekontroll görs efter publicering.

Inkluderar de tidigare opublicerade byggfixarna och den valfria uppdateringshistoriken från v3.42.0. Historikens databasadapter faller tillbaka när migrationen saknas; denna release kör ingen produktionsmigration.
