# Bevakly v3.42.0

Uppdateringstider kan nu jämföras över flera körningar för att identifiera återkommande flaskhalsar. Nyhetsflödet fortsätter fungera även om tidshistoriken inte är tillgänglig.

## Förändringar

- Tidshistorik: de senaste 40 körningarna inom 30 dagar, median, 90:e percentil och antal långsamma körningar. Organisation, bransch, läge, valt tidsintervall, bevakade aktörer och appversion hålls åtskilda. Egna branschtexter får egna jämförelsegrupper.
- En återkommande flaskhals kräver minst fem giltiga körningar och samma unika längsta steg i minst 60 procent av dem. Tidigare budgetar ändras inte automatiskt.
- Bedömningen Bra/Bevaka/Långsam använder uppdateringens totala tid. Tid utanför källor, artiklar och extern sökning visas som övrig bearbetning; den får inte tillskrivas en specifik subsystem utan ytterligare mätning.
- Tidshistoriken sparas i en transaktion med högst 750 ms nätverksbudget och idempotent körnings-ID. Om databas/schema/tid saknas visas att historik saknas.
- API:t för strategiska rörelser återställt från tidigare Git-version. Webbplatsbevakningens v2-kod hade hamnat i API-filen; den är återförd till sin avsedda modul. Textutdrag behåller originalets bokstavsform samtidigt som jämförelsen ignorerar skillnader i bokstavsform.
- Saknad import av scoreSignal, ofullständiga artikeltyper och flera äldre klient-/persistenstyper rättade. Byggningen får inte längre ignorera TypeScript-fel.
- Dependency lockfile tillagd och äldre regressionstesternas förväntningar uppdaterade till befintlig frågebredd och separata intagstak.

## Verifiering

- Full produktionsbyggning med TypeScript-kontroll: godkänd.
- Separat TypeScript-kontroll: godkänd.
- 53 QA-skript/testfiler: samtliga godkända.
- Produktionsserver lokalt: startsidan och /api/strategic-moves svarar HTTP 200; avsaknad av databas hanteras utan krasch.
- Ny tidshistorik testad med outliers, tomma/ogiltiga mätningar, dubletter, begränsat historikfönster, lika långa faser, separata bevakningar och avsaknad av databas.
- Inga credentials ingår i paketet.

## Produktionsstatus

Detta är ett källkodspaket byggt från GitHub main a4ffadf. Ingen push eller deployment har gjorts i denna arbetsomgång. Ingen produktionsmigration har körts och databaslagring av tidshistorik har inte verifierats mot en riktig databas.

För att aktivera historik krävs MIGRATION-v3.42.0-refresh-history.sql i appens databas och en fungerande DATABASE_URL. BEVAKLY_REFRESH_HISTORY_ENABLED=false kan stänga av historiken. Historikmätningen lagras före själva telemetritransaktionen; svarstidens mätning inkluderar även telemetritransaktionen.
