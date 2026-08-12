# EPF DPF Turneringsfinder – batch sync

## Hvorfor batch?
Rankedin hentes i bidder af 20 events, så Vercel-funktionen ikke timer ud.

## Data kommer direkte fra GetInfoAsync
- ClosingDate = tilmeldingsfrist
- StartDate = turneringsdato
- LocationName = center
- Address = by
- Latitude/Longtitude = region via Dataforsyningen
- Classes = niveau/række

## Manuel test
Efter deployment:
- /api/sync?page=0
- /api/sync?page=1
- fortsæt mens `next_page` er et tal

## Automatisk hver morgen
GitHub Actions-filen `.github/workflows/sync.yml` kører alle batches.

Opret én GitHub Repository Secret:
- Name: SYNC_BASE_URL
- Value: https://epf-turneringsfinder.vercel.app

Workflowet kører kl. 03:00 UTC, dvs. ca. kl. 05:00 i dansk sommertid.


## Crash fix
`api/sync.js` er genbygget rent fra batch-versionen.
Der er ingen dobbeltdefinerede funktioner.

Geo:
- RankedIn Address -> by
- Dataforsyningen postnumre/reverse -> by
- Dataforsyningen regioner/reverse -> region
- LocationName -> center, med adresse efter komma fjernet
- kendte bynavne i turnerings-/centernavn bruges kun som sidste fallback

Workflowet kører fortsat 6 gange dagligt.
