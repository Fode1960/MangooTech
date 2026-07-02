[OPEN] Debug session: product-photo-blocked

## Symptom
- La prise de photo fonctionne pour:
  - inscription livreur `Photo CNI / Permis`
  - creation du profil prestataire
- La prise de photo ne fonctionne pas pour:
  - photo du produit / preuve livraison dans le flux livreur

## Expected
- Le point photo du flux livraison doit se comporter comme les autres points photo deja fonctionnels.

## Falsifiable Hypotheses
1. Le bloc `photo produit` n'emprunte pas exactement le meme chemin runtime que `Photo CNI / Permis`.
2. Un overlay ou un gestionnaire global de la surface livraison intercepte l'action avant le `change` fichier.
3. Le DOM du bloc `proof` est re-rendu pendant la selection et invalide l'input actif.
4. Le traitement specifique livraison apres selection du fichier bloque l'apercu ou la sauvegarde.
5. Une surcouche ajoutee apres la version stable de juin perturbe uniquement le flux livraison.

## Observation Targets
- `handleLicenseUpload`
- `lpDeliveryHandleOverlayAction`
- `lpDeliveryOnProofFileChange`
- bloc rendu `phase === 'proof'`
- re-renders `lpDeliveryRenderDriverRequests`

## Constraints
- No business-logic fix before runtime evidence.
- First code change in existing code must be instrumentation only.
