# Rapport technique — Compatibilité Render

Projet : **Mangoo Connect+** (`docs/mangoo-ui`)
Date : 2026-08-25
Objet : vérifier la faisabilité et les prérequis avant déploiement sur **Render**.

Ce rapport est établi à partir du code réel (`server.cjs`, `package.json`, `Dockerfile`, `.env.example`, `nginx.conf`, `docker-compose.yml`). Il ne contient aucune valeur estimée : chaque point est sourcé depuis les fichiers.

---

## 1. Version exacte de Node.js

- `package.json` → `"engines": { "node": ">=18" }`.
- `Dockerfile` → image de référence **`node:20-alpine`** (Node 20 LTS).

Recommandation Render : définir `NODE_VERSION=20` (ou laisser Render lire `engines.node`). **Node 20 LTS** est la cible sûre. Le code utilise `crypto.scrypt`, `crypto.randomUUID`, `fs`, `path`, `http`, `https`, `os` — toutes disponibles nativement, aucune dépendance native à compiler.

---

## 2. Commandes build et start

- **Build** : **aucun build requis**. C'est un site statique (HTML/CSS/JS) servi par un serveur Node. Pas de bundler (Vite/webpack), pas de transpilation.
- **Install** : `npm install --omit=dev` (le `Dockerfile` fait exactement cela).
- **Start** : `node server.cjs` (équivalent à `npm start`).

Dans Render, configurer :
| Champ | Valeur |
|---|---|
| Build Command | `npm install --omit=dev` |
| Start Command | `node server.cjs` |
| Runtime | Node |

---

## 3. Tous les ports utilisés

Le serveur écoute sur **`0.0.0.0`** :

| Port | Rôle | Obligatoire sur Render |
|---|---|---|
| `8080` (`PORT`) | HTTP : pages publiques + API + signalisation WebRTC/WebSocket | **Oui** — c'est le port exposé par Render |
| `8443` (`HTTPS_PORT`) | HTTPS interne (cert auto-signé `cert.pem`/`key.pem`) | **Non** — Render termine le TLS en amont |

Détail clé : le serveur ne démarre le HTTPS interne (`8443`) que si `cert.pem` et `key.pem` existent sur disque. Sur Render, on s'appuie sur le TLS géré par Render ; le port interne `8443` est inutile.

---

## 4. Démarrage des WebSockets

Bibliothèque : **`ws`** (`"ws": "^8.21.3"`, seule dépendance runtime).

Deux canaux temps réel partagent le même serveur HTTP(S) :

| Chemin | Rôle |
|---|---|
| `/webrtc-ws` | Présence, chat, rendez-vous, live shopping |
| `/delivery-ws` | Mangoo Express+ (livreurs, vendeurs, clients) |

Mécanisme (dans `server.cjs`, lignes 4891-4937) :
- `http.createServer(handleHttp)` crée le serveur HTTP.
- `new WebSocketServer({ noServer: true })` pour chaque canal.
- Un routeur d'upgrade unique `routeUpgrade()` est branché sur `httpServer.on('upgrade', ...)` et dispatche selon le chemin (`/webrtc-ws` vs `/delivery-ws`).

Ce modèle `noServer + upgrade` est **le pattern standard compatible Render** (Render relaie les WebSockets sur les Web Services). Aucun réglage spécial nécessaire, mais il faut confirmer que Render utilise bien HTTP/1.1 pour l'upgrade (c'est le cas par défaut).

---

## 5. Liste complète des variables d'environnement

### 5.1 Configuration serveur (reconnues par `server.cjs`)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8080` | Port HTTP |
| `HTTPS_PORT` | `8443` | Port HTTPS interne (inutilisé sur Render) |
| `ADMIN_EMAIL` | `admin@mangootech.com` | Email du compte admin initial |
| `ADMIN_PASSWORD` | *(vide)* | Mot de passe admin initial (vide = généré aléatoirement, affiché une fois) |
| `ADMIN_PIN` | *(vide)* | PIN admin à 4 chiffres (vide = généré une fois) |
| `ADMIN_PASSWORD_RESET` | *(vide)* | Rotation d'urgence (usage unique) : force un nouveau mot de passe au démarrage |
| `ADMIN_PIN_RESET` | *(vide)* | Rotation d'urgence (usage unique) : force un nouveau PIN au démarrage |
| `FORCE_HTTPS_ADMIN` | `true` | Force le HTTPS sur l'espace admin |

### 5.2 Clés opérateurs de paiement (optionnelles, mode live)

Le serveur passe chaque opérateur en **mode sandbox** si ces clés sont absentes. Elles ne sont pas encore réellement exploitées (voir section 15).

| Variable | Opérateur |
|---|---|
| `ORANGE_MONEY_API_KEY`, `ORANGE_MONEY_CLIENT_ID` | Orange Money |
| `WAVE_API_KEY`, `WAVE_SECRET_KEY` | Wave |
| `MTN_MOMO_API_KEY`, `MTN_MOMO_SUBSCRIPTION_KEY` | MTN Mobile Money |
| `MOOV_API_KEY`, `MOOV_CLIENT_ID` | Moov Money |
| `FREE_MOBILE_API_KEY`, `FREE_MOBILE_CLIENT_ID` | Free Mobile Sénégal |

### 5.3 Environnement

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` (posée par le Dockerfile) |

Remarque : le serveur charge aussi un fichier `.env` local au démarrage, mais **une variable déjà présente dans l'environnement n'est pas écrasée**. Sur Render, on définit tout dans les *Environment Variables* du service (ou via un groupe partagé).

---

## 6. Fichiers qui doivent être persistants

Point critique : les services Render ont un **système de fichiers éphémère**. Tout ce qui est écrit hors d'un **Render Disk** est perdu à chaque redéploiement/redémarrage.

Il faut monter un **Render Persistent Disk** sur le dossier **`/app/data`** (répertoire `data/` du projet).

Sont concernés :
- le dossier `data/*.json` (toute la "base de données"),
- le fichier `.env` n'est **pas** nécessaire sur le disque (variables injectées par Render),
- `cert.pem` / `key.pem` : **inutiles** sur Render (TLS géré par Render).

---

## 7. Fichiers JSON utilisés comme base de données

18 fichiers JSON sont référencés dans `server.cjs`, tous dans `data/`.

### 7.1 Présents dans le dépôt (seed fourni)

| Fichier | Contenu |
|---|---|
| `prestations.json` | Services des prestataires |
| `catalogue.json` | Produits physiques (DAN Boutique) |
| `inventaire.json` | Stock |
| `inventaire-mouvements.json` | Mouvements de stock |
| `galerie.json` | Galerie |
| `boosters.json` | Boosters |
| `booster-stats.json` | Statistiques boosters |
| `vendor-config.json` | Configuration vendeur |
| `payment-methods.json` | Modes de paiement |
| `offres-jour.json` | Offres du jour |
| `negotiations.json` | Négociations |
| `admin-config.json` | Configuration admin |

### 7.2 Créés à l'exécution (et exclus de Git, sensibles)

| Fichier | Contenu |
|---|---|
| `users.json` | Comptes utilisateurs (hash des mots de passe) |
| `sessions.json` | Sessions (tokens) |
| `transactions.json` | Transactions de paiement |
| `wallets.json` | Portefeuilles vendeur/client |
| `couriers.json` | Livreurs |
| `deliveries.json` | Courses / livraisons |

Ces 6 fichiers sont dans `.gitignore` (donc **absents** du dépôt). Ils seront créés au premier démarrage et doivent vivre sur le **Render Disk** pour survivre aux redéploiements.

---

## 8. Dépendances externes

### 8.1 npm (runtime)

| Paquet | Version | Usage |
|---|---|---|
| `ws` | `^8.21.3` | WebSocket (seule dépendance) |

### 8.2 Services tiers (côté client, dans le navigateur)

| Service | Usage | Contrainte |
|---|---|---|
| Leaflet (bundlé `assets/leaflet.js`) | Carte Local+ | Aucun appel réseau serveur |
| Lucide (bundlé `assets/lucide.min.js`) | Icônes | Aucun appel réseau |
| Nominatim / OpenStreetMap | Reverse-geocoding (détection ville) | ~1 requête/seconde par IP ; à remplacer par un géocodeur commercial si trafic réel |

### 8.3 Opérateurs de paiement

Orange Money, Wave, MTN MoMo, Moov Money, Free Mobile. **Déclarés mais non réellement intégrés** : voir section 15 (risques paiement).

Aucun appel HTTP sortant n'est effectué par `server.cjs` (aucun `https.request`, `fetch`, ni SDK Stripe/PayPal dans le code).

---

## 9. Stratégie de sauvegarde

**État actuel : aucune sauvegarde automatisée.** Les données vivent uniquement dans `data/*.json`.

Recommandations pour Render :
1. **Render Disk** : active la persistance, mais n'est **pas** une sauvegarde (pas de snapshot automatique du contenu).
2. Ajouter un job de sauvegarde : copie périodique de `data/` vers un stockage objet (Cloudflare R2, S3, Backblaze B2) — ex. via un *Cron Job* Render qui archive `data/` et l'envoie.
3. Conserver une copie des 6 fichiers sensibles (`users.json`, `sessions.json`, `transactions.json`, `wallets.json`, `couriers.json`, `deliveries.json`) hors du dépôt Git, chiffrée.

À décider : la fréquence (quotidienne recommandée) et la destination du backup.

---

## 10. Besoins en PostgreSQL

**Aucun à ce stade.** La persistance est 100 % fichier JSON.

À anticiper pour la montée en charge : les écritures concurrentes sur JSON deviendront un goulot d'étranglement et un risque de corruption. Une migration future vers Postgres (Render fournit des instances Postgres managées, ou Supabase) est le chemin naturel, **sans changer l'app côté utilisateur** (le serveur Node deviendrait le seul point d'accès à la base).

---

## 11. Besoins éventuels en Redis

**Aucun.** L'état temps réel (`clients`, `calls`, `chatLog`, `live`, `fileTransfers`) est stocké **en mémoire**, dans le processus Node.

Conséquence importante : cet état est **non partagé**. Cela interdit le multi-instance (scale horizontal) tant que Redis ou un broker pub/sub n'est pas introduit. Pour l'instant, un seul service mono-instance suffit.

---

## 12. Besoins en stockage de fichiers

- **Données** : JSON légers → Render Disk (quelques Mo).
- **Transferts de fichiers / pièces jointes** : le serveur gère un canal de transfert en mémoire (`fileTransfers`, taille max 50 Mo par fichier, `MAX_FILE_SIZE`). **Aucun upload persistant sur disque n'est identifié** (pas de `writeFileSync` vers un dossier d'upload ; seuls les fichiers `data/*.json` sont écrits). Les images de la galerie/produits sont référencées par URL/chemin, pas stockées sur disque par le serveur.

Point à confirmer avant mise en production : si les pièces jointes/chat doivent être **conservées**, il faudra ajouter un vrai stockage (disque + emplacement dédié, ou objet storage). Actuellement elles semblent transitoires (en mémoire).

---

## 13. Configuration Cloudflare

**Actuel (local)** : `cloudflared-config.yml` utilise un **Cloudflare Tunnel** (`cloudflared`) vers `localhost:8080`, avec 3 sous-domaines (`demo`, `preview`, `admin` → `mangoo.tech`).

**Production avec Render** : on abandonne le Tunnel, on passe en **DNS proxy (orange cloud)** :

1. Dans Cloudflare, créer des enregistrements DNS de type `CNAME` pointant vers l'URL Render (`xxx.onrender.com`), avec le proxy Cloudflare **activé** (orange).
2. Domaines à configurer : `mangoo.tech`, `demo.mangoo.tech`, `preview.mangoo.tech`, `admin.mangoo.tech`.
3. Côté Render : ajouter ces domaines dans les *Custom Domains* du service (Render fournit un certificat TLS automatique).
4. TLS : **Full (strict)** recommandé dans Cloudflare (Cloudflare ↔ Render en TLS valide).

Remarque : le code détecte déjà `X-Forwarded-Proto: https` (fonction `isSecureRequest`, ligne 2552) — donc l'espace admin fonctionne correctement derrière Cloudflare + Render sans boucle de redirection.

---

## 14. Procédure exacte de déploiement sur Render

1. **Préparer le dépôt** : le projet doit être dans Git. S'assurer que `.env` est bien ignoré (c'est déjà le cas) et que `data/users.json` etc. ne sont pas versionnés (déjà dans `.gitignore`).
2. **Créer le service** : Render → *New → Web Service*, brancher le dépôt.
3. **Configurer** :
   - Runtime : **Node**.
   - Build Command : `npm install --omit=dev`.
   - Start Command : `node server.cjs`.
   - Instance type : **Starter** (7 $/mois) minimum (le plan Free s'endort, inadapté à une boutique 24/7).
4. **Attacher un Render Disk** :
   - *New → Disk*, taille minimale (1 Go suffit largement).
   - Mount Path : **`/app/data`**.
5. **Variables d'environnement** (Render → *Environment*) :
   - `PORT=8080` (Render injecte `PORT` automatiquement, mais `8080` est déjà le défaut).
   - `NODE_ENV=production`.
   - `FORCE_HTTPS_ADMIN=false` (le TLS est terminé par Render, sinon risque de 426/301 inutiles — ou laisser `true` : le code reconnaît `X-Forwarded-Proto`, donc les deux fonctionnent).
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PIN` : valeurs de production **fortes** (sinon générées et affichées une seule fois dans les logs).
6. **Déployer** : Render lance le build puis `node server.cjs`.
7. **Vérifier** : `https://<service>.onrender.com/health` → 200 ; puis connexion admin, accès API, WebSocket.
8. **Brancher Cloudflare** : ajouter les *Custom Domains* (`mangoo.tech` + sous-domaines) côté Render, puis les enregistrements DNS `CNAME` proxy côté Cloudflare (section 13).

---

## 15. Risques connus (sessions, paiements, WebSocket)

### Sessions
- Les sessions sont dans `data/sessions.json` (token + cookie `mgt_session`). Si le Render Disk n'est **pas** monté, toutes les sessions sont perdues à chaque redéploiement → déconnexion de tous les utilisateurs.
- Une rotation de mot de passe admin doit s'accompagner d'une purge des sessions obsolètes (déjà documenté dans `DEPLOIEMENT.md`).

### Paiements — risque majeur
- **Le paiement est 100 % simulé.** `initiateMobilePayment()` et `confirmMobilePayment()` n'effectuent **aucun appel réel** aux opérateurs : ils enregistrent une transaction en base et renvoient un statut. Le mode "live" change seulement un libellé (`mode: live`), pas le comportement.
- Conséquence : **aucun argent réel n'est encaissé** tant que les connecteurs (Orange Money, Wave, MTN, Moov, Free, carte, PayPal) ne sont **réellement implémentés** (appels HTTP vers les API des opérateurs). C'est un prérequis bloquant pour un vrai e-commerce en production.
- Tant que ce n'est pas fait, tout parcours de paiement doit être **explicitement étiqueté "Démo/simulation"**.

### WebSocket
- L'état temps réel est **en mémoire et mono-processus** : pas de scale horizontal sans Redis/pub-sub. Un seul service Render = OK, mais ne pas activer plusieurs réplicas.
- Les redéploiements coupent les connexions WebSocket (déconnexion momentanée des clients en direct). Prévoir une reconnexion automatique côté client (à vérifier).
- Render relaie les WebSockets, mais la longueur des timeouts doit être vérifiée (ping/pong côté client recommandé pour garder les connexions ouvertes).

### Divers
- Nominatim (reverse-geocoding) est limité à ~1 req/s par IP : à remplacer par un géocodeur commercial si le trafic augmente.
- La persistance JSON n'est pas adaptée aux écritures concurrentes massives ; prévoir la migration Postgres à moyen terme.

---

## Synthèse

| Critère | Verdict |
|---|---|
| Compatible Render (Web Service Node) | ✅ Oui |
| Build/start | ✅ Aucun build ; `node server.cjs` |
| WebSocket | ✅ Compatible (`ws` + `noServer`) |
| Persistance | ⚠️ Nécessite un Render Disk sur `/app/data` |
| PostgreSQL | ❌ Non requis (JSON) — à prévoir plus tard |
| Redis | ❌ Non requis (mono-instance) |
| Paiements réels | ❌ **Non implémentés** (simulation) — bloquant |
| Sauvegarde | ⚠️ À mettre en place |
