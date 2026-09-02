# Bevakly v0.5.0 – release notes

## Levererat
- Källspecifika adapters/filter för webb-källorna.
- TED integrerat i huvudflödet med standardfrågan `buyer-country = SWE AND classification-cpv = 905*`.
- TED-metadata för beställare, CPV, deadline, uppskattat värde och plats när API:t returnerar fälten.
- Kalibrerad procurement-score så en färsk svensk avfallsupphandling normalt når minst `Relevant`.
- Händelseklassning och separat maskinell Bevakly-bedömning.
- `Bevaka härnäst` med tre konkreta uppföljningspunkter per händelsetyp.
- Supabase-persistens utökad med kategori/tolkning via befintliga eventfält.

## Verifierat i arbetsmiljön
- TypeScript-kärnan för adapters, analys, artikelutvinning, dedupe, entities, score, sources och TED: OK.
- API-routes för source-preview och ted-preview typkontrollerade med ramverksstubs: OK.
- Smoke-test: svensk avfallsupphandling gav score 56 / `Relevant`, kategori `Upphandling`: OK.
- Adapter-smoke-test för Regeringen filtrerade bort irrelevant sidlänk: OK.

## Inte verifierat här
- Full `next build`: npm-beroenden kunde inte installeras färdigt i miljön (`next` saknades lokalt).
- Live-HTTP mot TED och externa webbplatser: arbetsmiljön har begränsad extern nätåtkomst.
