# Bevakly v2.3.0 — automatisk datainsamling

## Nytt
- Bevakly startar nu sin riktiga källinsamling automatiskt en gång per dygn via Vercel Cron.
- Den automatiska körningen använder samma källmotor som `/api/source-preview` och sparar nya/uppdaterade händelser i Neon.
- Du behöver därför inte längre öppna `/api/source-preview` manuellt för normal användning.
- Schemat är satt till 05:30 UTC varje dag, vilket motsvarar ungefär 06:30 svensk vintertid och 07:30 svensk sommartid.
- Ingen ny databasändring krävs jämfört med v2.2.0.

## Varför bara en gång per dygn?
Bevakly ligger på Vercel Hobby. Den planen tillåter dagliga cron-körningar men inte flera schemalagda körningar per dygn. Om projektet senare flyttas till en plan med tätare cron-stöd kan bevakningen enkelt ökas.

## Viktigt
- Appen hämtar fortfarande aktuell data när relevanta vyer öppnas.
- Cron-körningen bygger framför allt upp den historik i Neon som behövs för trender, svaga signaler och strategiska mönster.
