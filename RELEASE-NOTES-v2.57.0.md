# Bevakly v2.57.0 – Följ denna förändring

## Nytt
- Knappen **Följ denna förändring** på Signalradarns förändringskort.
- Följda förändringar sparas i browserns localStorage per bevakningsprofil.
- Stabilt `caseKey` baserat på konkurrent + geografi, med fallback till geografi eller rubrik.
- Varje ny industry-feed-körning jämför aktuell signal mot den senast sparade bilden.
- Status: **Stärks**, **Stabil**, **Försvagas**, **Ingen ny träff**, **Avslutad**.
- Status kan stärkas av högre escalation score, fler fakta eller senare process-steg.
- Status kan försvagas vid tydligt lägre score eller cooling.
- Om signalen inte återkommer blir den först stabil, sedan försvagad och efter längre tid "Ingen ny träff".
- Ny panel **Följda förändringar** med score, faktamängd och möjlighet att avsluta bevakningen.

## Guardrails
- Följningen är lokal i webbläsaren. Ingen serverbaserad persistent historik påstås.
- `caseKey` använder entity-first matching för att minska risken att två olika konkurrenter i samma stad blandas ihop.
- Ett statusbyte betyder förändring i Bevaklys källunderlag, inte att framtiden är bekräftad.

## Begränsning
Automatisk e-post/push-notis eller cross-device-bevakning ingår inte ännu eftersom produktionsdatabasens persistens inte är verifierad.
