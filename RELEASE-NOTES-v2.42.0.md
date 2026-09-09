# Bevakly v2.42.0 – News Intake Diagnostics

## Mål
Göra nyhetsinsamlingen mätbar så att nästa volymökning angriper den verkliga flaskhalsen i stället för att bara höja fler gränsvärden.

## Ändringar
- Ny `news-intake-diagnostics`-motor med stegvis bortfallsanalys.
- Fast Source Network mäter nu:
  - konfigurerade källor
  - lyckade/misslyckade källhämtningar
  - råa kandidater
  - kluster som faktiskt behandlas
  - saknad primärkandidat
  - lyckade/misslyckade artikelhämtningar
  - saknat/ogiltigt publiceringsdatum
  - artiklar utanför vald period
  - accepterade artiklar i feeden
- Extern discovery mäter nu:
  - köade och körda sökjobb
  - provider requests och cacheträffar
  - antal providerträffar
  - processade resultat
  - accepterade resultat före dedupe
  - avvisade resultat per konkret orsak
  - träffar borttagna av dedupe
  - accepterade slutresultat
- API:t returnerar `newsIntakeDiagnostics` med success rates, acceptance rates, största bortfall och aktuell huvudflaskhals.
- Ingen kvalitetsgrind har tagits bort eller lättats i denna release.

## QA
- Fokuserad TypeScript-kontroll av `news-intake-diagnostics.ts` och `discovery-orchestrator.ts`: godkänd.
- Full Next.js-build är inte verifierad eftersom dependencies saknas installerade i releaseunderlaget.
- Ingen deployment eller live-providerkörning påstås vara utförd.
