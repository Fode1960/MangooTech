# Mangoo Connect+ — Guide de lancement et de tests

Ce guide explique comment lancer le serveur temps réel et tester la **Messagerie** (appels audio/vidéo, messages, rendez-vous) entre un **vendeur (PC)** et un **client (Android)**, dans les deux sens.

> La nouvelle version est constituée de pages HTML statiques servies par un petit serveur Node (`server.cjs`). L'ancienne version React est conservée à part et ne doit pas être modifiée.

---

## 1. Prérequis

- **Node.js** installé (testé avec Node 22).
- Les **deux appareils sur le même réseau Wi-Fi**.
- Le dossier du projet : `docs/mangoo-ui/`.

---

## 2. Lancer le serveur

Depuis le dossier `docs/mangoo-ui/`, double-cliquez sur :

```
start-server.cmd
```

Ou, en ligne de commande :

```powershell
cd docs/mangoo-ui
node server.cjs
```

Le serveur démarre sur deux ports :

| Protocole | Port | Usage |
|---|---|---|
| HTTP | `8080` | Messagerie (texte) — pas de caméra/micro |
| HTTPS | `8443` | **Appels audio/vidéo** — caméra/micro obligatoire |

---

## 3. Ouvrir l'application

**Règle d'or : utilisez HTTPS (`8443`) sur les deux appareils**, sinon la caméra et le micro sont bloqués par le navigateur.

| Appareil | URL |
|---|---|
| PC (vendeur) | `https://192.168.1.18:8443` |
| Android (client) | `https://192.168.1.18:8443` |

> Remplacez `192.168.1.18` par l'adresse IP locale de la machine qui exécute le serveur (affichée au démarrage du serveur).

Au premier chargement :

1. **Acceptez l'avertissement de certificat** (il est auto-signé, c'est normal).
2. **Autorisez l'accès à la caméra et au micro** à la première demande.

---

## 4. Identités de test

| Rôle | Identifiant interne | Nom affiché |
|---|---|---|
| Vendeur (PC) | `vendor-amina` | Chez Amina |
| Client (Android) | `client-moussa` | Moussa (affiché « Moussa D. » côté vendeur) |

Sur le PC, ouvrez le module **Messagerie** puis la conversation **« Moussa D. »**.
Sur Android, ouvrez **« Chez Amina »**.

---

## 5. Scénarios de test

Vérifiez que chaque scénario fonctionne **dans les deux sens** (PC → Android et Android → PC).

1. **Connexion** : l'indicateur à côté du nom du correspondant affiche « En ligne ».
2. **Messagerie** : envoyer/recevoir un message texte.
3. **Appel audio** : sonnerie, réponse, raccrochage.
4. **Appel vidéo** : sonnerie, réponse, image et son, raccrochage.
5. **Refus d'appel** : l'appelant voit l'appel se terminer.
6. **Rendez-vous** :
   - Client → bouton calendrier **« Demander un rendez-vous »** (formulaire : prestation, jour, heure).
   - Client → bouton **« Mes rendez-vous »** (icône calendrier) pour suivre ses propres demandes et leur statut (En attente / Confirmé / Refusé).
   - Vendeur : la demande apparaît dans **Messagerie** et dans l'**Agenda**.
   - Vendeur accepte ou refuse → le client voit la confirmation/le refus (message + mise à jour dans « Mes rendez-vous »).

---

## 6. Scénario Live Shopping (vendeur PC ↔ client Android)

Le module **Live Shopping** utilise le même serveur temps réel (`/webrtc-ws`) mais avec un protocole dédié : état du live, chat public, partage de produit, commande et « j'aime ».

| Appareil | URL |
|---|---|
| PC (vendeur) | `https://192.168.1.18:8443/pages/dashboard-live.html` |
| Android (client) | `https://192.168.1.18:8443/pages/live-client.html` |

### Déroulé du test

1. **Connexion** : ouvrez les deux pages. Le vendeur est `vendor-amina` (Chez Amina), le client `client-moussa` (Moussa D.).
2. **Démarrer le live** : sur PC, cliquez sur **« Démarrer le live »** et autorisez l'accès à la caméra/micro. L'aperçu local s'affiche dans la zone vidéo.
3. **Diffusion vidéo** : sur Android, la page passe à « EN DIRECT » et reçoit automatiquement le flux vidéo de la caméra du vendeur (WebRTC). Ajoutez un second spectateur (autre appareil/onglet) pour vérifier la diffusion multi-spectateurs.
4. **Second flux (écran + caméra en incrustation)** : côté vendeur, ouvrez le menu **« + »** puis **« Partager mon écran »**. Sur Android, l'écran du vendeur s'affiche en plein écran et la caméra du vendeur reste visible en incrustation (PiP) en haut à droite ; l'aperçu local du vendeur fait de même (écran en fond, caméra en petit encart). Le partage d'écran est une option secondaire, volontairement masquée derrière le menu « + » pour garder l'écran de diffusion simple.
5. **Indicateur de qualité réseau** : côté vendeur, en haut à droite de la vidéo, une simple pastille indique l'état de la diffusion (En attente / Connexion / Diffusion stable / Signal correct / Signal faible / Diffusion interrompue). Pas de chiffres : quand le signal est faible, le libellé affiche directement le conseil « rapprochez-vous du Wi-Fi ».
6. **Spectateurs** : le compteur côté vendeur s'incrémente à chaque spectateur connecté et se décrémente quand un spectateur ferme la page.
7. **Chat public** : envoyez un message depuis Android → il apparaît dans le chat vendeur ; envoyez depuis le PC → il apparaît sur Android.
8. **Partage de produit** : côté vendeur, cliquez sur **« Partager »** sur une carte produit. La fiche produit (nom + prix) apparaît sur Android avec le bouton **« Commander »**.
9. **Commande en un clic** : sur Android, la fiche produit affiche un raccourci d'achat avec la quantité pré-remplie à `1` et le mode de livraison pré-rempli sur `Livraison`. Un seul appui sur **« Commander maintenant »** envoie la commande avec ces valeurs ; la quantité et le mode (`Livraison` / `Retrait`) restent ajustables en un geste avant de commander. Côté vendeur, le compteur « Commandes en direct » s'incrémente et l'événement apparaît dans le chat.
10. **J'aime** : sur Android, tapez sur le cœur. Le compteur de « Likes » côté vendeur s'incrémente.
11. **Arrêter le live** : côté vendeur, cliquez sur **« Arrêter le live »**. Android repasse immédiatement à « Hors ligne » et le flux vidéo est coupé.

### Pont vers le module Commandes

Chaque commande passée pendant le live est **persistée côté serveur** puis injectée dans le module **Commandes** en temps réel :

1. Avec un live en cours, passez une commande depuis Android.
2. Ouvrez `https://192.168.1.18:8443/pages/dashboard-orders.html` sur le PC.
3. La commande apparaît **immédiatement** en haut du tableau avec le badge **« Live · En cours »**, et le compteur **« En cours »** s'incrémente.
4. Rechargez la page Commandes : la commande live est rechargée depuis le serveur (`/orders/live`), preuve qu'elle est persistée et non plus seulement diffusée en direct.

> La diffusion vidéo (caméra vendeur → plusieurs spectateurs), le second flux écran + caméra en incrustation, l'indicateur de qualité réseau et le pont des commandes Live → module Commandes sont actifs.

---

## 6 bis. Scénario Live Shopping (vendeur mobile → Android / iOS)

Le vendeur peut aussi diffuser **depuis un téléphone** (pas seulement depuis le PC). La page mobile vendeur reprend exactement le même protocole : démarrage du live, caméra, chat, partage de produit, réception des commandes.

| Appareil | URL |
|---|---|
| Téléphone du vendeur | `https://192.168.1.18:8443/pages/live-vendor.html` |
| Android (client) | `https://192.168.1.18:8443/pages/live-client.html` |
| iOS (client) | `https://192.168.1.18:8443/pages/live-client.html` |

> Le vendeur mobile utilise la même identité `vendor-amina` (Chez Amina) : ouvrez **soit** la page PC, **soit** la page mobile, mais pas les deux en même temps (le serveur refuse un second live tant que le premier est actif).

### Déroulé du test

1. Sur le téléphone du vendeur, ouvrez `live-vendor.html`, appuyez sur **« Démarrer le live »** et autorisez la caméra/micro (l'aperçu s'affiche plein écran).
2. **Cadrage** : ouvrez le menu **« + »** → **« Cadrage »**. Basculez entre **Plein écran** (l'image remplit tout l'écran) et **Portrait** (le cadre entier est visible, sans recadrage).
3. **Caméra avant/arrière** : appuyez sur le bouton **flèche circulaire** dans la barre de contrôle pour basculer entre la caméra avant et la caméra arrière, sans interrompre le live.
4. Sur les téléphones des clients (Android et/ou iOS), ouvrez `live-client.html` : les deux passent à « EN DIRECT » et reçoivent le flux du vendeur mobile.
5. Vérifiez que le compteur de spectateurs du vendeur mobile passe à `2`.
6. Envoyez un message de chat depuis Android → il apparaît sur le vendeur mobile et sur iOS.
7. Partagez un produit depuis le vendeur mobile (« Partager » sur une carte) → la fiche apparaît sur les deux clients.
8. Commandez depuis iOS avec « Retrait » ou « Livraison » → le vendeur mobile voit la commande, et elle apparaît dans le module Commandes (PC).
9. Appuyez sur **« Arrêter »** → les deux clients repassent à « Hors ligne ».

> Le partage d'écran est masqué derrière le bouton « + » sur le vendeur mobile ; il n'est pas disponible sur iOS (limitation du navigateur) mais fonctionne sur Android/PC.

---

## 6 ter. Appel privé de négociation (client ↔ vendeur)

Le Live Shopping permet au **client d'appeler le vendeur** pour négocier en privé, et réciproquement au **vendeur d'appeler un client**. L'appel est audio (voix) et reste **privé** : pendant l'appel, le micro diffusé publiquement est coupé, donc les autres spectateurs n'entendent rien.

### Liens de test

| Appareil | URL |
|---|---|
| PC (vendeur) | `https://192.168.1.18:8443/pages/dashboard-live.html` |
| Téléphone du vendeur | `https://192.168.1.18:8443/pages/live-vendor.html` |
| Android (client A) | `https://192.168.1.18:8443/pages/live-client.html?id=client-moussa&name=Moussa` |
| Android/iOS (client B) | `https://192.168.1.18:8443/pages/live-client.html?id=client-aisha&name=Aisha` |

> Donnez un `id` **différent** à chaque client via l'URL (`?id=…&name=…`), sinon deux appareils partageront la même identité `client-moussa`.

### Sens 1 — Client appelle le vendeur

1. Le vendeur démarre le live, le client rejoint.
2. Sur le client, appuyez sur **« Appeler »** (bouton dans l'en-tête, visible pendant le live).
3. Le vendeur voit **« Moussa vous appelle »** avec **Accepter / Refuser**.
4. Le vendeur **accepte** → communication privée établie (le micro public est coupé).
5. Chacun peut **raccrocher** ; le micro public se réactive automatiquement.
6. Si le vendeur **refuse**, le client voit « Chez Amina a refusé l'appel ».

### Sens 2 — Vendeur appelle un client

1. Le vendeur démarre le live, un ou plusieurs clients rejoignent.
2. Côté vendeur, une bande **« Spectateurs »** apparaît (sur mobile : sous les statistiques ; sur PC : en haut du chat) avec un bouton **téléphone** par spectateur.
3. Le vendeur appuie sur le téléphone d'un client → le client reçoit **« Chez Amina vous appelle »**.
4. Le client **accepte** → communication privée ; **refuse** → le vendeur voit « Moussa a refusé l'appel ».
5. Raccrochage depuis l'un ou l'autre côté.

---

## 7. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Aucun message ni appel | Ancienne version en cache | Recharger avec `Ctrl + Shift + R` (PC) ou vider le cache (Android) |
| Caméra/micro refusés | Page ouverte en HTTP | Ouvrir en `https://…:8443` |
| « Caméra/micro indisponibles » | Contexte non sécurisé (HTTP) | Passer en HTTPS |
| L'indicateur reste « Hors ligne » | Serveur non démarré ou mauvais réseau | Vérifier `node server.cjs` et le même Wi-Fi |
| Téléphone ne charge pas la page | Pare-feu bloque le port | Autoriser les ports `8080` et `8443` |

---

## 8. Fichiers clés

| Fichier | Rôle |
|---|---|
| `server.cjs` | Serveur statique + signalisation WebSocket (`/webrtc-ws`) |
| `start-server.cmd` | Script de lancement |
| `assets/mangoo-connect-plus.js` | Bibliothèque client (WebSocket + WebRTC) |
| `pages/chat.html` | Côté client (Android) |
| `pages/dashboard-messages.html` | Messagerie côté vendeur |
| `pages/dashboard-agenda.html` | Agenda / rendez-vous côté vendeur |
| `pages/dashboard-live.html` | Live Shopping côté vendeur (PC) |
| `pages/live-vendor.html` | Live Shopping côté vendeur (mobile) |
| `pages/live-client.html` | Live Shopping côté client (Android/iOS) |
| `pages/dashboard-orders.html` | Module Commandes (reçoit les commandes Live) |
| `cert.pem` / `key.pem` | Certificat auto-signé (HTTPS) |
