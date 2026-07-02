[OPEN] Debug session: driver-proof-android

## Symptom
- Android livreur affiche l'interface photo de juin, mais la photo ne se telecharge pas.

## Scope
- Surface: `public/mangoo-local.html`
- Role: Livreur Android
- Step: `proof`

## Falsifiable Hypotheses
1. Le bouton ouvre le selecteur Android, mais l'evenement `change` n'arrive pas.
2. Le fichier est choisi, mais `FileReader` echoue ou renvoie une charge vide.
3. La photo est lue, mais l'ecriture dans le job echoue a cause du stockage/taille.
4. La preuve est ecrite, mais le rendu relit un autre job ou ne rerend pas le bon etat.
5. Android charge une version en cache differente de celle attendue.

## Planned Observation Points
- `lpDeliveryOpenProofPicker`
- `lpDeliveryHandleOverlayChange`
- `lpDeliveryOnProofFileChange`
- `FileReader.onload`
- readback `lpDeliveryGetJob(id)` after save

## Notes
- No business-logic fix before runtime evidence.

## Evidence Collected
- Pre-fix logs show `proof-open action received` then `proof picker open requested` with `inputFound: true`.
- No `proof input change captured` log arrived after Android selection attempt.
- Conclusion: the failure is before `change`/`FileReader`; the hidden programmatic click path is the likely blocker on Android.

## Minimal Fix Applied
- Keep the same simple June-looking control.
- Replace JS-opened hidden button flow with a native `label for` trigger.
- Add direct inline `onchange` on the file input so Android does not depend only on delegated overlay change handling.

## User Direction Change
- User requested `Restauration stricte juin`.

## Strict June Restoration Applied
- Proof UI restored to hidden input + simple `Photo preuve` button.
- `lpDeliveryCompressImageDataUrl()` restored to the June path with JPEG quality `0.82`.
- `lpDeliveryOnProofFileChange()` restored to the June path calling `lpDeliveryCompressImageDataUrl(raw, 900, ...)`.

## Evidence After Strict June Restore
- Re-test still KO on Android.
- Logs still stop at:
  - `proof-open action received`
  - `proof picker open requested`
- Logs still never reach:
  - `proof input change captured`
  - `proof file change handler entered`
  - `file reader loaded proof image`
- Confirmed root cause at this stage:
  - The June programmatic `input.click()` path opens/focuses the picker request, but Android does not emit the file `change` event afterward in this runtime.

## Evidence-Based Fix Applied
- Keep the same simple visual control.
- Replace programmatic picker open with native `label for="<input>"`.
- Attach direct inline `onchange` to the proof input so the Android file selection does not depend on delegated overlay events.
