# Bevakly v3.43.1

Livekontrollen av v3.43.0 hittade två kvarvarande fel. Denna patch rättar båda:

- En artikel om Göteborg kunde få en falsk träff på Värmland från annan text på källsidan. Profilval och kortens geografi använder nu rubrikens tydliga plats först, därefter den synliga sammanfattningen. Osynliga geografier från sidans övriga text kan inte skapa en profilträff.
- Ett forskningsresultat klassades som produktuppdatering på ordet “introducing” i text om en forskningsgrupp. Forskning har en egen etikett; generella introduktioner av grupper räcker inte som produktlansering. Modellträning skiljs från utbildningsprogram och modellregeln stöder pluralformer.

Regressionsfall återger båda de observerade livefelen. Alla 55 QA-filer, TypeScript-kontrollen och produktionsbygget passerar. Releasen inkluderar alla sju åtgärder från v3.43.0. Ingen produktionsmigration körs.
