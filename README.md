# EPF DPF Turneringsfinder – Region + tydelig by/center

Denne version indeholder:
- EPF/Lunar Liga-inspireret design
- Regionfilter: Hovedstaden, Sjælland, Syddanmark, Midtjylland, Nordjylland
- Geografisk opslag via Dataforsyningens officielle adresse-API under sync
- By og center vises tydeligt hver for sig
- Classes-baseret kombinationsfilter (fx Dame + DPF60)
- Supabase publishable key er allerede indsat i app.js

Vercel Environment Variables skal fortsat være:
- SUPABASE_URL = https://toeamjaomjgamdmavdck.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = din secret/service role key

Efter deployment:
1. Åbn /api/sync for at genopbygge region/by-data.
2. Genindlæs forsiden.


## Center-rettelse
Center prioriterer nu Rankedin Location/venue-navnet. Eksempel: `Rocket Padel Viborg - Fabrikvej`. Adresse bruges separat til by og region.
