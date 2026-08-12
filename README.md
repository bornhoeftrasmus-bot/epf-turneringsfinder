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


## Geo-fix + 6 daglige opdateringer
Denne version bruger samme Dataforsyningen-opslag til både **by** og **region**.
Prioritet for by:
1. Postnummer/by direkte fra RankedIn Address.
2. By fra Dataforsyningen via RankedIns koordinater.
3. By fra Dataforsyningen via RankedIns adresse.

Center kommer fortsat fra RankedIn `LocationName` (fallback `ClubName`).

GitHub Actions kører 6 gange pr. døgn:
03:00, 07:00, 11:00, 15:00, 19:00 og 23:00 UTC.
I dansk sommertid svarer det til ca. 05:00, 09:00, 13:00, 17:00, 21:00 og 01:00.
Ved vintertid forskydes de danske klokkeslæt én time.
