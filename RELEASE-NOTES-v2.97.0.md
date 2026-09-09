# Bevakly v2.97.0 – Regional Media Expansion

## Vad som ändrats
- Sveriges regionala journalistiknät breddas med nio ytterligare SVT-lokalredaktioner.
- De 19 SVT-lokaleditionerna täcker nu samtliga 21 län via explicit `regions`-metadata.
- Alla SVT-lokaleditioner märks med samma `publisherGroup: svt-local`.
- Source Network rapporterar publisher groups separat från antal källsidor.
- Source Diversity räknar regionala editions från samma publicist som en provenance-grupp, så geografisk bredd inte felaktigt blir källoberoende.

## Varför
Kommunala originalkällor är viktiga men kan komma sent i ett händelseförlopp. Lokal journalistik kan fånga konflikt, överklagande, kapacitetsproblem, taxeförändringar, upphandlingar och lokala etableringssignaler tidigare. Samtidigt får 19 SVT-editions inte behandlas som 19 oberoende redaktionella bekräftelser.

## Guardrail
Regional räckvidd är inte samma sak som oberoende evidens. `publisherGroup` separerar dessa två dimensioner. En uppgift som återkommer i flera SVT-regioner blir därför inte automatiskt starkare bara för att flera SVT-sidor publicerat den.

## Begränsning
Releasen verifierar källkonfiguration och regressionstester. Den påstår inte att varje regional sida redan levererar relevanta artiklar i produktion eller att live-yield är verifierad.
