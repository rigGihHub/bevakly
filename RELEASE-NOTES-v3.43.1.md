# Bevakly v3.43.1

Livekontrollen av v3.43.0 hittade två kvarvarande fel. Denna patch rättar båda:

- En artikel om Göteborg kunde få en falsk träff på Värmland från annan text på källsidan. Profilval och kortens geografi använder nu rubrikens tydliga plats först, därefter den synliga sammanfattningen. Osynliga geografier från sidans övriga text kan inte skapa en profilträff.
- Ett forskningsresultat klassades som produktuppdatering på ordet “introducing” i text om en forskningsgrupp. Forskning har en egen etikett; generella introduktioner av grupper räcker inte som produktlansering. Modellträning skiljs från utbildningsprogram och modellregeln stöder pluralformer.

Regressionsfall återger båda de observerade livefelen. Enligt valideringen för PR #23 passerade alla 55 QA-filer, TypeScript-kontrollen och produktionsbygget. Releasen inkluderar alla sju åtgärder från v3.43.0. Ingen produktionsmigration körs.

## Produktionspublicering

En färdigbyggd förhandsversion är inte samma sak som en publicerad produktionsversion. `vercel.json` tillåter automatiska Git-publiceringar från `main`; övriga grenar är avstängda.

Publicera från senaste `main` med målmiljö **Production**. Kontrollen den 4 oktober 2026 visade att `DATABASE_URL` endast är konfigurerad för produktionsmiljön. Flytta därför inte en befintlig Preview till produktion utan att först säkerställa att den byggts med korrekt produktionskonfiguration. Ändra inte databasnycklarnas miljöomfattning eller förhandsversionernas åtkomstskydd för att kringgå detta.

Efter varje publicering ska följande kontrolleras:

1. Vercels publicering har `target: production` och `readyState: READY`.
2. Publiceringens Git-revision motsvarar den avsedda revisionen på `main`, inte bara ett liknande versionsnamn eller en färdig Preview.
3. Produktionsdomänen pekar på den nya publiceringen och appen visar förväntad version.
4. Nyhetsflödet laddar, tidigare resultat bevaras under uppdatering och geografifiltret samt forskningsklassningen kontrolleras i appen.

Om någon kontroll saknas ska status vara **inte produktionsverifierad**, inte “klart”. Testresultat från en tidigare releasekontroll ska inte presenteras som en ny genomförd testkörning.

### Avläst läge före denna dokumentationsuppdatering, 2026-10-04

- `main`: `bcb9803edda917e085567d4254e3e672c84ab380`, v3.43.1, PR #23 sammanslagen.
- Senaste listade produktionspublicering: `a173b1c890d76528492f543065213159997bb20e`, v3.43.0, `READY`.
- Förhandsversion av v3.43.1: `542f74d8a21698c01152476aed6ae7b3888d51d5`, `READY`, inte produktion.

Detta är en tidsstämplad observation, inte ett påstående om att en senare publicering har lyckats. Dokumentationsuppdateringen ändrar ingen applikationskod, ingen databas och inga hemligheter.
