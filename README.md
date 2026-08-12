# EPF DPF Turneringsfinder – cloud-version

Denne version bruger:
- GitHub repository
- Vercel hosting
- Supabase database
- Ren HTML/CSS/JavaScript
- Ingen Svelte

## Farvepalette
- #2C292A
- #98B4DF
- #2A3E91
- #F0ECE5
- #D6CCBB

## Sådan kommer du i gang

### 1. app.js
Erstat:
- `__SUPABASE_URL__`
- `__SUPABASE_ANON_KEY__`

med din Supabase Project URL og din publishable/anon key.

Brug aldrig service role key i app.js.

### 2. Vercel Environment Variables
Opret disse i Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Supabase
Den eksisterende tabel `tournaments` forventes at have:
- rankedin_id
- name
- levels
- categories
- classes
- tournament_date
- deadline
- center
- city
- rankedin_link
- updated_at

Der skal være en public SELECT/RLS-policy på de turneringsdata, frontenden må læse.

### 4. Deploy
Upload alle filer fra ZIP'en til roden af dit GitHub repository.
Forbind repositoryet til Vercel.

### 5. Sync
Efter deployment:
`https://DIT-DOMÆNE.vercel.app/api/sync`

### 6. Embed på EPF
Brug fx:

```html
<iframe
  src="https://DIT-DOMÆNE.vercel.app/"
  width="100%"
  height="900"
  style="border:0;border-radius:18px;"
  loading="lazy">
</iframe>
```

## Vigtigt
Rankedin-endpoints kan ændre sig. `api/sync.js` bygger på de endpoints,
der allerede er testet i det eksisterende EPF-projekt.
