[OPEN] Debug session: driver-track-distance

## Symptom
- Sur PC, Android et iOS, la distance entre le livreur et le point de retrait est enorme.
- En se deplacant, aucun mouvement n'apparait sur les 3 cartes.
- Le comportement ne reflete ni la version du 16 au 19 juin, ni celle d'hier.

## Scope
- Surface: `public/mangoo-local.html`
- Roles: Livreur / Client / Vendeur
- Features: tracking live, carte partagee, mission active

## Falsifiable Hypotheses
1. La carte suit le mauvais `jobId`, donc un ancien retrait ou une ancienne mission.
2. Les tracks livreur ne sont plus publies pendant le deplacement.
3. Les tracks sont publies mais rejetes par la logique de plausibilite, donc pas de mouvement visible.
4. La carte utilise un point de depart par defaut au lieu de la position reelle du telephone.
5. Le tunnel/mobile charge une version differente qui n'est pas synchronisee avec la logique courante.

## Planned Observation Points
- `lpDeliveryStartTracking`
- `lpDeliveryPublishTrack`
- `lpDeliveryFetchTrackRemote`
- `lpOpenDeliveryTracking`
- `lpDeliveryLiveSummary`
- readback `server/data/delivery-jobs.json`
- readback `server/data/delivery-tracks.json`

## Notes
- No business-logic fix before runtime evidence.

## Evidence Collected
- `delivery-jobs.json` contains several concurrent non-done jobs across different boutiques.
- Recent active jobs often keep `job.track.lat/lng = null` while `delivery-tracks.json` does contain a valid live track for the same `jobId`.
- The user screenshot shows tracking opened on `Boutique Locale`, not on `PC4 Boutique`, proving the wrong mission can be selected on the surface before movement is even considered.
- `lpDeliveryStartTracking()` was only called on accept, not when the driver re-opened the driver surface with an already active mission.

## Fix Applied
- Prefer the most relevant active driver mission using:
  - Local+/PC4 priority
  - latest activity timestamp (`remoteUpdatedAt`, `phaseUpdatedAt`, `assignedAt`, `createdAt`)
- Auto-resume tracking when the driver surface re-renders with an active mission but tracking is stale or attached to another `jobId`.
