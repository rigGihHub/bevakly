# Bevakly v2.49.0 – Municipal Protocol Radar

## Fokus
Fånga tidiga och verifierbara marknadssignaler från kommunala protokoll och nämndhandlingar utan att gissa kommunala URL:er eller sänka kvalitetskraven.

## Nytt
- Eget `Municipal Protocol Radar`-spår i aktiv discovery.
- Tre reserverade protokollsökningar per körning i avfallsprofilen.
- Providerbudgeten höjs från 16 till 18 frågor, medan kostnadstaket fortsatt är 0,20 per körning.
- Första verifierade kommunvärdar: Örebro, Stockholm och Göteborg.
- Sökning efter protokoll, ärendelistor, tjänsteutlåtanden och nämndhandlingar med teman som avfall, återvinning, investering, kapacitet, mark, detaljplan, entreprenad och miljö.
- Hård `allowedHosts`-kontroll i orchestratorn. Resultat utanför verifierad officiell värd sorteras bort innan analys.
- Ingen automatisk konstruktion eller gissning av kommun-URL:er.
- Kommunprotokoll klassas som myndighets-/primärkällor i discovery-pipelinen.
- Datum kan återvinnas konservativt ur dokumentrubrik/URL, inklusive `YYYY-MM-DD`, `YYYY/MM/DD` och `YYYYMMDD`.
- News Intake Diagnostics redovisar träffar som stoppats därför att de låg utanför verifierad officiell kommunvärd.
- Kommunprotokoll-radarn exponeras separat i API-diagnostiken med verifierade kommuner, värdar och aktiva queries.

## Budgetfördelning
- 12 platser: news discovery
- 3 platser: kommunala protokoll
- återstående platser: authority/municipality early-signal discovery
- max 18 providerfrågor
- fortsatt kostnadstak 0,20 per körning

## Begränsningar
- Första releasen täcker endast tre explicit verifierade kommunstrukturer. Detta är avsiktligt; täckning ska utökas med verifierade endpoints, inte genom URL-gissning.
- Extern discovery kräver fortfarande konfigurerad Brave eller Tavily-provider.
- Full Next.js-build, live-providerkörning och production-deployment är inte verifierade i denna release.
