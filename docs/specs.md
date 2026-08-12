# Spécifications fonctionnelles et techniques

> MangooTech v167 — 12/08/2026

---

## 1. Local+ Map (Carte interactive)

**Fonctionnel :** Carte géolocalisée affichant les vendeurs locaux (boutiques et prestataires). L'utilisateur voit les marqueurs autour de sa position, peut cliquer pour voir la fiche détaillée, filtrer par catégorie, et lancer un appel/chat.

**Technique :**
- Librairie : Leaflet.js + tuiles OpenStreetMap
- Fonction d'entrée : `initMap()` [l.11327](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L11327)
- Hydratation vendeurs : `hydrateVendorsFromStorage()` [l.10650](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L10650)
  - Merge seeds (données par défaut) + localStorage (cache) + API Supabase
  - Règle 11 : les champs critiques (services, coverage, isMobile) des seeds ne sont JAMAIS écrasés par des données API vides
- FAB (Floating Action Buttons) : Ajouter, Liste, Filtres — contrôlés par `lpRefreshFloatingUi()`
- Plage : [l.10650-12100](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L10650-L12100)

**États :**
| État | Comportement |
|------|-------------|
| Carte visible, pas de session | FAB masqués, fiche client classique |
| Carte visible, session prestataire | FAB visibles, accès dashboard proprio |
| Carte visible, session boutique | FAB visibles, gestion boutique |

---

## 2. Dashboard Prestataire/Boutique

**Fonctionnel :** Interface de gestion pour prestataires et boutiques. Accessible via PIN ou email. Onglets : Vue d'ensemble, Prestations, Commandes, Chat, Approvisionnement, Live.

**Technique :**
- Fonction d'entrée : `showProviderDashboardInline()` [l.12393](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L12393)
- Changement onglet : `switchProviderTab(tabName)` [l.31634](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L31634)
- Authentification PIN : `lpClaimVendorByPin(pin)` [l.8676](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L8676)
- Commandes : `renderProviderOrders()` [l.16419](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L16419)
  - Source 1 : localStorage (`lpReadClientOrders()`)
  - Source 2 : API `GET /api/live-orders/by-vendor/:vendorId`
  - Fusion avec déduplication (priorité serveur)

**Sécurité :**
- Check `isOwnerProvider()` : vérifie `email === ownerEmail` (pas seulement `mangoo_my_provider_id`)
- `lpClaimVendorByPin` définit `mangoo-current-user` dans localStorage

**Vue sans session :** Seuls 🌍 Langue, ❓ Aide & Support, 🔔 Notifications (placeholder) restent visibles.

---

## 3. Live Shopping

**Fonctionnel :** Diffusion vidéo en direct pour les vendeurs. Les clients rejoignent le stream, voient les produits, peuvent chatter et acheter en direct. Badge "LIVE" visible sur la carte et la fiche prestataire.

**Technique :**
- Streaming : WebRTC (P2P vendeur → chaque viewer)
- Signalisation : WebSocket port 3008 (messages `live:*`)
- WebRTC : `RTCPeerConnection` par viewer dans `_lpLivePeerConnections`
- Self-view : caméra locale visible dans un coin de l'écran

**Fonctions clés :**

| Fonction | Ligne | Rôle |
|----------|------|------|
| `lpStartLive()` | 26365 | Démarre le flux (getUserMedia + interface) |
| `lpStopLive()` | 26816 | Arrête le live, ferme connexions |
| `lpCallLiveVendor()` | 27385 | Client appelle le vendeur depuis le live |
| `_lpFlushPendingViewers()` | 27183 | Connecte les viewers en attente |
| `_lpRestoreLiveMic()` | 27642 | Restaure l'audio après appel privé (v3) |
| `_lpRebuildViewers()` | 27704 | Reconstruit la liste des viewers |

**Restauration audio Live après appel privé (v3) :**
1. Fermeture de toutes les connexions `_lpLivePeerConnections`
2. Délai 600ms
3. `getUserMedia({audio:true})` — ré-acquisition physique du micro
4. Remplacement du track audio dans `_lpLiveStream`
5. Reconstruction des connexions viewers via `_lpRebuildViewers()`

**État actuel :** Fonctionnel pour les prestataires. Restauration audio v3 en attente de validation utilisateur.

**Plage :** [l.26205-28000](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L26205-L28000)

---

## 4. WebRTC Calls (Appels audio/vidéo)

**Fonctionnel :** Appels audio entre clients et vendeurs. Sonnerie, overlay d'appel, transition micro entre appel et Live.

**Technique :**
- Signalisation : WebSocket port 3008 (`call-notification`, `call-accepted`, `call-ended`, `call-routing`)
- WebRTC : `RTCPeerConnection` avec échange SDP/ICE
- Push : si le vendeur n'a pas le dashboard ouvert, notification push avec boutons Accepter/Refuser

**Fonctions clés :**

| Fonction | Ligne | Rôle |
|----------|------|------|
| `startAudioCall()` | 6884 | Initie l'appel |
| `handleCallEnded()` | 18217 | Termine l'appel, restaure le micro Live |
| `initMgmtWebSocket()` | 17386 | Initialise la connexion WebSocket |

**Plage :** [l.6884-18500](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L6884-L18500)

---

## 5. Messagerie / Chat Connect+

**Fonctionnel :** Chat temps réel client-vendeur. Trois contextes : overlay Connect+ (dédié), chat dans le Live Shopping, chat dans le Dashboard.

**Technique :**
- Transport : WebSocket port 3008 (messages `chat-message`, `incoming-chat`, `chat-notification`)
- Persistance : `server/data/connect-plus-chat-store.json` (max 100 msg/room)
- Hors-ligne : notification push si le vendeur n'est pas connecté
- Room ID : format `chat:vendorId`

**Fonctions clés :**

| Fonction | Ligne | Rôle |
|----------|------|------|
| `lpOpenVendorCommunication()` | 12933 | Ouvre le chat overlay |
| `lpOpenClientChat()` | 18548 | Ouvre le chat côté client |
| `_lpAppendLiveChatMsg()` | 27118 | Message dans le chat live |

**Plage :** [l.3442-27200](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L3442-L27200) (CSS + HTML + logique)

---

## 6. Push Notifications

**Fonctionnel :** Notifications push pour les vendeurs (nouveaux appels, messages) même dashboard fermé. Bannières Windows avec boutons Accepter/Refuser. Favicon Mangoo dans la notification.

**Technique :**
- Service Worker : `/sw.js`
- API : Push Manager + `web-push` (VAPID)
- Enregistrement : `lpInitPushSubscription()` [l.17166](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L17166)
- Souscription : `POST /push/subscribe` (port 3008)
- Anti-duplication : `saveSubscription` remplace tous les anciens abonnements (1 seul par vendor)
- Détection changements tunnel : flag `lp_push_origin` force le nettoyage

**Configuration critique :**
- SW doit avoir `actions` (boutons) sinon notifications silencieuses sous Windows
- URL de notification : doit inclure `?vendor=X&lpRole=vendor`
- Icône : `/favicon.svg`
- Focus Assist Windows : doit être désactivé pour les bannières

**Plage :** [l.4412-4500](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L4412-L4500), [l.17166-17345](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L17166-L17345)

---

## 7. Paiements

**Fonctionnel :** Paiement multi-méthodes via un modal unique. Supporte Orange Money, MTN MoMo, Wave, Carte bancaire, PayPal, Stripe. Génération de reçus numériques.

**Technique :**
- Modal : `openPaymentModal(amount, callback)` [l.28773](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L28773)
- Traitement : `processRealPayment()` [l.28957](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L28957)
- Achat Live : `lpBuySharedProduct()` [l.16119](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L16119)
- Sauvegarde commande : `POST /api/live-orders/record-payment`

**Sécurité :**
- Nettoyage `#paymentPhone` à 5 points du flux (ouverture, succès, fermeture overlay, bouton X, deuxième instance)
- Aucune donnée client ne survit à une session de paiement

**Plage :** [l.28770-29500](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L28770-L29500)

---

## 8. Boosters (Visibilité)

**Fonctionnel :** Mise en avant payante des fiches vendeurs. 3 types : Sponsorisé (2000F/24h, tête des résultats), En Promo (3000F/3j, badge promo), Nouveau (1000F/48h, badge nouveauté).

**Technique :**
- Activation : `setVendorBoost(vendorId, patch)` [l.7707](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L7707)
- Configuration : `getBoostConfig()` / `setBoostConfig()` [l.7405-7418](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L7405-L7418)
- Synchronisation : `syncBoostsFromServer()` [l.7524](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L7524)
- API : `/api/boosts/vendor-boosts-active`
- Stockage : localStorage + Supabase
- Interface : modal 2 clics (choisir → payer), pas d'iframe React

**Plage :** [l.7354-21100](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L7354-L21100)

---

## 9. Page publique vendeur

**Fonctionnel :** Fiche détaillée d'un vendeur accessible publiquement. Vue différenciée propriétaire vs client.

**Vue propriétaire :**
- `vendorPrimaryActions` masqué (Discuter/Itinéraire/Appeler)
- `ownerEditLink` visible (Booster/Ma fiche/Paiement/Mon compte/Quitter)

**Vue client :**
- `ownerEditLink` masqué
- `vendorPrimaryActions` visible

**Implémentation :** [l.18420-18428](file:///c:/Users/mdans/Documents/MangooTech/public/mangoo-local.html#L18420-L18428)

---

## 10. Réunions internes (LiveKit)

**Fonctionnel :** Visioconférence interne pour l'équipe MangooTech.

**Technique :**
- Librairie : LiveKit Server SDK
- Route : `/api/internal/meet`
- Socket.IO : `internalMeetSocket.ts`
- Restreint aux emails autorisés (allowlist)

---

## 11. Livraison & Géolocalisation

**Fonctionnel :** Suivi de livraison en temps réel avec partage de position GPS.

**Technique :**
- Routes : `/api/delivery-tracking`, `/api/geolocation`
- SSE : `/api/orders/stream` pour les mises à jour en temps réel
- Calcul itinéraires : OSRM via `/api/routing`

---

## Comptes de référence

| Prestataire | ID | PIN | Téléphone |
|-------------|-----|-----|-----------|
| **DAN Electricité** (réf.) | 1784327703839 | — | — |
| Mangoo Répar | — | 6841 | — |
| Tailleur Élégance | — | 4821 | 0674435701 |
| Plombier Express | — | 5916 | 0674435702 |
| Menuisier Bois Pro | — | 3749 | 0674435703 |
| Service Elec+ | — | 8053 | 0674435704 |
