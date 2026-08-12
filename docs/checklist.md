# Checklist MangooTech

> État au 12/08/2026 — Commit `607599a` (branche `stable-scenarios-A-B`)

---

## ✅ FAIT, TESTÉ ET VALIDÉ

### Scénarios principaux
- [x] **Scénario A (Dashboard ouvert)** : Paiement, confirmation et suivi de commande
- [x] **Scénario B (Dashboard fermé/Push)** : Notifications push avec Accepter/Refuser + Favicon

### Live Shopping
- [x] Live Shopping fonctionnel pour tous les prestataires (vidéo + audio + chat + produits)
- [x] Self-view auto-start côté vendeur
- [x] "Voir produit" côté client (`_getProductsForCall()`)
- [x] Badge "LIVE" sur la carte et fiche prestataire
- [x] Appel privé pendant un Live sans couper le Live (code v3 restauré : coupure/restauration micro après appel + bloc serveur FALLBACK LIVE)
- [x] Tests structurels 10/10 (test-final.cjs)

### Dashboard
- [x] Navigation Dashboard après PIN
- [x] Onglet Commandes avec fusion localStorage + API serveur
- [x] Sauvegarde commandes serveur (`POST /api/live-orders/record-payment`)
- [x] Bouton "Mon compte" : redirection Dashboard si session active
- [x] Page "Mon compte" épurée sans session

### Paiement
- [x] Modal de paiement stylisé Mangoo (remplace `prompt()` natif)
- [x] Méthodes : Orange Money, MTN, Wave, Carte, PayPal, Stripe
- [x] Sécurité anti-fraude : nettoyage `#paymentPhone` 5 points
- [x] Flux "Demander à un tiers" (split paiement) corrigé

### Booster
- [x] Modal 2 clics (choisir → payer)
- [x] 3 options : Sponsorisé 2000F / Promo 3000F / Nouveau 1000F
- [x] Activation via `setVendorBoost()` + `filterVendors()`

### Messagerie
- [x] Chat WebSocket temps réel (port 3008)
- [x] Persistance messages (`connect-plus-chat-store.json`, max 100/room)
- [x] Push notifications pour messages hors-ligne
- [x] RoomID normalisé `chat:vendorId`

### WebRTC Calls
- [x] Appels audio client-vendeur
- [x] Signalisation via WebSocket (offer/answer/ICE)
- [x] Push notification appel entrant
- [x] Overlay fin d'appel propre

### Infrastructure
- [x] Architecture 3 serveurs (3015, 3045, 3008)
- [x] `serve-dist.cjs` : serveur statique production (remplace Vite)
- [x] Proxy API + WebSocket fonctionnel
- [x] Build Vite stable (0 erreurs)
- [x] Tests 10/10 infrastructure

### Nettoyage
- [x] Suppression comptes test (Mangoo Elect, Électricien Sécurité, Réparateur Mobile)
- [x] PINs/emails/tél dédiés pour 5 prestataires
- [x] Plus aucune occurrence de `ios10@exemple.com` ni `pc4@example.com`
- [x] Suppression code mort (App-backup.jsx, App-simple.jsx, dossiers .dbg/, scripts .bat/.ps1)
- [x] Suppression `mangoo-local-v1.html`
- [x] Suppression `server/server/data/` en doublon

### UI/UX
- [x] Charte graphique sobre (palette logo : vert foncé, orange, vert clair)
- [x] Icônes `lucide-react` (plus d'emojis)
- [x] Avatars à initiales
- [x] Composants refondus (LandingPage, Footer, ShopPage)

### Bugs corrigés (20 au total)
- [x] Double notification push
- [x] Notifications silencieuses Windows (SW sans actions)
- [x] Notification parasite ("Notifications activées")
- [x] Nom "Invité" persistant
- [x] Chevauchement carte produit / modal paiement
- [x] FAB métiers disparu après navigation
- [x] Modules "Mon compte" visibles sans session
- [x] `updateSplitCalc()` non définie (tiers)
- [x] Commandes prestataire sans persistance
- [x] Timing DOM affichage commandes
- [x] "Page générique" services/coverage vides
- [x] `isOwnerProvider` inversé
- [x] ID salle WebRTC mismatch
- [x] Erreurs push (404, VAPID, FCM 410)
- [x] Onglet vendeur bloqué "Appel terminé"
- [x] Encodage corrompu (PowerShell)
- [x] Carte pas plein écran + conflit z-index
- [x] Page locale bloquée au chargement

---

## 🔄 EN COURS / À VALIDER

- [ ] **Régression Live/Appel privé corrigée** — code v3 restauré (`_lpRestoreLiveMic`, `_lpRebuildViewers`, restauration micro) **+ bloc serveur « FALLBACK LIVE » restauré** (envoi `incoming-call` direct au vendeur via `session.vendorWs`), **test utilisateur requis**
  - Ouvrir le tunnel Cloudflare : `https://break-live-powerseller-exciting.trycloudflare.com`
  - Hard refresh (`Ctrl+Shift+R`) pour charger le code restauré
  - Scénario : DAN PC démarre Live → Client rejoint → Appel privé → **Vendeur reçoit la notification** → Vendeur accepte → **Vérifier que le Live reste actif** (vidéo + audio)

---

## 🔜 RESTE À FAIRE

### Features
- [ ] **Adapter Live Shopping pour les boutiques (Local+)**
- [ ] **Simplifier la page Dashboard** (réduire doublons de boutons)
- [ ] **Refonte sections admin/prestataires** dans `App.jsx`
- [ ] **Découpe structurelle de `App.jsx`** (extraire écrans auth)

### Validation
- [ ] **Re-test Scénario B (Push notifications)** post-corrections Dashboard
- [ ] **Validation mobile complète** (Android)
- [ ] **Test restauration audio Live v3** en conditions réelles

### Déploiement
- [ ] **Déploiement production sur Vercel** (conditionné à boutiques + boosters terminés)

### Dette technique
- [ ] Composants WebRTC/SIP legacy à traiter
- [ ] ~46 warnings ESLint résiduels (zones WebRTC/live complexes)

---

## 📋 RÈGLES DE TEST (v167)

1. **IMPLÉMENTER → TESTER → ATTEINDRE 10/10 → APPROUVER → SUITE**
2. Tests en conditions réelles uniquement (Edge, serveurs en marche, Cloudflare, Supabase)
3. Cloudflare et Supabase sont les références absolues
4. Ne rien casser de ce qui a été validé
5. Supprimer le code/données obsolètes (REPLACE, pas MERGE)
6. Tests de résilience : Connexion → Déconnexion → Reconnexion (min. 3x)
7. Alignement `vendor_id` serveur/client obligatoire
8. Toute feature validée pour les prestataires doit être adaptée aux boutiques
9. Tester toute nouvelle implémentation après l'avoir implémentée et ne passer à la suite que si les tests (10/10) sont validés et approuvés que c'est bien implémenté

---

## 🏗️ INFRASTRUCTURE ACTIVE

| Serveur | Port | Statut |
|---------|------|--------|
| Statique (serve-dist.cjs) | 3015 | ✅ |
| API Express | 3045 | ✅ |
| WebSocket WebRTC | 3008 | ✅ |
| Cloudflare Tunnel | variable | ✅ (à relancer après reboot) |
| Supabase | cloud | ✅ |

---

## 📦 DERNIER COMMIT

`607599a` — `fix: Restauration audio Live après appel privé (v3) + serveur statique production`
- Branche : `stable-scenarios-A-B`
- 14 fichiers, +806/-826 lignes
