# Déploiement Render — Mangoo Connect+

Projet : **Mangoo Connect+** (`docs/mangoo-ui`)
Date : 2026-08-25
Statut : **prêt à déployer** (persistance, sauvegarde, WebSocket, paiement DEMO, sécurité et health check validés).

Ce document décrit la configuration exacte de déploiement sur **Render Web Service**. Il complète `RAPPORT-COMPATIBILITE-RENDER.md` (analyse) et reflète l'état réel du code après les corrections de sécurisation.

---

## A. Configuration Render

| Champ | Valeur |
|---|---|
| Runtime | **Node** (version cible : **Node 20 LTS**) |
| Build Command | `npm install --omit=dev` |
| Start Command | `node server.cjs` |
| Port | **`8080`** (via variable `PORT` ; c'est le seul port exposé par Render) |
| Instance | **Starter** (le plan Free s'endort, inadapté à une boutique 24/7) |
| Persistent Disk | **Oui** — taille minimale (1 Go suffit largement) |
| Mount Path | **`/app/data`** |

Le serveur écoute sur `0.0.0.0`. Il ne démarre le HTTPS interne (`8443`) que si `cert.pem`/`key.pem` existent sur disque : inutile sur Render (TLS géré en amont).

---

## B. Variables d'environnement

À définir dans Render → *Environment* (aucune valeur secrète n'est écrite ici).

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `8080` | Port HTTP exposé par Render |
| `NODE_ENV` | `development` | Mettre `production` |
| `DATA_DIR` | `./data` | **`/app/data`** (Persistent Disk) |
| `ADMIN_EMAIL` | `admin@mangootech.com` | Email du compte admin initial |
| `ADMIN_PASSWORD` | *(vide)* | **Obligatoire en production.** Mot de passe admin (jamais généré ni écrit sur disque en prod) |
| `ADMIN_PIN` | *(vide)* | **Obligatoire en production.** PIN admin 4 chiffres |
| `ADMIN_PASSWORD_RESET` | *(vide)* | Rotation d'urgence du mot de passe (usage unique) |
| `ADMIN_PIN_RESET` | *(vide)* | Rotation d'urgence du PIN (usage unique) |
| `FORCE_HTTPS_ADMIN` | `true` | Forçage HTTPS espace admin (peut rester `true`, `X-Forwarded-Proto` est reconnu) |
| `BACKUP_ENABLED` | `false` | Mettre `true` en production |
| `BACKUP_DIR` | `<DATA_DIR>/backups` | Dossier des archives (par défaut sur le Persistent Disk) |
| `BACKUP_RETENTION_DAYS` | `7` | Conservation des archives locales |
| `PAYMENT_MODE` | `demo` | **Laisser `demo`** (aucun opérateur réel n'est intégré) |

Clés opérateurs (optionnelles, non utilisées tant que `PAYMENT_MODE=demo`) : `ORANGE_MONEY_API_KEY`, `WAVE_API_KEY`, `MTN_MOMO_API_KEY`, `MOOV_API_KEY`, `FREE_MOBILE_API_KEY`, etc. Ne les renseigner qu'avec des API validées.

---

## C. Cloudflare

Abandonner le Tunnel local (`cloudflared`) : en production, on passe en **DNS proxy**.

1. Cloudflare → DNS → enregistrements `CNAME` pointant vers l'URL Render (`xxx.onrender.com`), **proxy activé** (nuage orange).
2. Render → *Custom Domains* : ajouter ces domaines (Render fournit un certificat TLS automatique).
3. TLS Cloudflare : **Full (strict)**.

### Enregistrements DNS exacts (Cloudflare)

| Nom (Host) | Type | Contenu (Value) | Proxy | Rôle |
|---|---|---|---|---|
| `mangoo.tech` | `CNAME` | `<service>.onrender.com` | ✅ Orange (proxied) | Domaine principal |
| `demo.mangoo.tech` | `CNAME` | `<service>.onrender.com` | ✅ Orange (proxied) | Démo |
| `preview.mangoo.tech` | `CNAME` | `<service>.onrender.com` | ✅ Orange (proxied) | Prévisualisation |
| `admin.mangoo.tech` | `CNAME` | `<service>.onrender.com` | ✅ Orange (proxied) | Administration |

> Remplacer `<service>.onrender.com` par l'URL réelle du Web Service Render une fois créé (visible dans Render → service → *Settings*). La cible peut être identique pour les 4 sous-domaines : le serveur sert les mêmes pages et route l'espace admin par le chemin `/pages/admin*` (protégé par session).

### Domaines Render (Custom Domains)

Ajouter dans Render → service → *Settings* → *Custom Domains* :

| Domaine | Remarque |
|---|---|
| `mangoo.tech` | Domaine racine |
| `demo.mangoo.tech` | |
| `preview.mangoo.tech` | |
| `admin.mangoo.tech` | L'espace admin reste accessible aussi via `mangoo.tech/pages/admin.html` |

Les 4 noms doivent être renseignés **à la fois côté Cloudflare (CNAME)** et **côté Render (Custom Domains)** pour que le certificat TLS soit émis et que le proxy accepte le trafic.

Le serveur détecte déjà `X-Forwarded-Proto: https` (`isSecureRequest`) : pas de boucle de redirection, cookie `Secure` posé correctement derrière le proxy. Aucune dépendance obligatoire à `cloudflared` pour le déploiement Render.

---

## D. Backup

Implémentation actuelle : `backup-data.cjs` (script autonome, aucune dépendance externe).

- Archive horodatée **compressée (gzip)** de `DATA_DIR`, sans modifier les données d'origine.
- Vérifie que l'archive est bien créée et non vide.
- Rétention configurable (`BACKUP_RETENTION_DAYS`).
- Activé via `BACKUP_ENABLED=true` ; appelable par un **Render Cron Job** : `node backup-data.cjs`.
- `BACKUP_DIR` par défaut = **`<DATA_DIR>/backups`** (soit `/app/data/backups`) : les archives vivent sur le **Persistent Disk**, pas dans l'espace éphémère du conteneur.

> **Important — limitation connue :** la sauvegarde locale protège contre certaines erreurs (suppression accidentelle, corruption d'un fichier), **mais PAS contre la perte complète du Persistent Disk** (disque perdu = sauvegarde perdue).

**Prochaine étape (non faite ici) :** envoyer les archives vers un stockage externe — Cloudflare R2, S3, Backblaze B2 ou équivalent — depuis le Cron Job Render.

---

## E. Paiement

**Le paiement est actuellement en mode DEMO / SIMULATION.**

- `PAYMENT_MODE=demo` par défaut : **aucune somme réelle n'est débitée**.
- Aucun appel réseau aux opérateurs (Orange Money, Wave, MTN MoMo, Moov Money, Free Mobile) n'est effectué.
- L'abstraction `PaymentProvider` isole le reste de l'application : `Commande → PaymentService → PaymentProvider`. Aujourd'hui, seul `DemoPaymentProvider` est actif.
- Les transactions portent `mode: "demo"` et l'interface affiche : **« Paiement en mode démonstration — aucune somme réelle n'est débitée. »**
- Le passage en production réelle exigera d'implémenter les providers (`OrangeMoneyProvider`, `WaveProvider`, etc.) avec des API validées, puis `PAYMENT_MODE=live` — sans refaire l'application.

---

## F. WebSocket

**Fonctionnement mono-instance** (état temps réel en mémoire).

- Canaux : `/webrtc-ws` (présence, chat, rendez-vous, Live Shopping) et `/delivery-ws` (Mangoo Express+).
- Heartbeat serveur (ping/pong) toutes les 30 s, détection et nettoyage des connexions mortes.
- Reconnexion automatique côté client avec **backoff progressif** (1 s → 2 s → 4 s → 8 s → 16 s max), réinitialisée à chaque reconnexion réussie.
- **Ne pas activer plusieurs réplicas** : l'état mémoire n'est pas partagé. Un seul service Render.

---

## F2. Notifications Web Push (VAPID)

**Fonctionnalité : recevoir appels, messages et notifications de Live Shopping même lorsque le Dashboard est FERMÉ** (simple connexion internet + navigateur actif en arrière-plan). Architecture standard Service Worker + VAPID.

- Service Worker : `/sw.js` (réception, affichage, ouverture de la page au clic).
- Abonnement côté client : `/assets/mangoo-push.js` (chargé automatiquement via `mangoo-connect-plus.js`).
- Côté serveur : `web-push` (ajouté à `package.json`, installé par `npm install --omit=dev`), abonnements persistés dans `data/push-subscriptions.json`.
- Déclenchements : appel entrant (destinataire hors ligne), nouveau message (destinataire hors ligne), démarrage d'un live (tous les clients abonnés).

**Clés VAPID — génération automatique.** Au premier démarrage, le serveur génère les clés et les persiste dans `DATA_DIR/vapid.json` (Persistent Disk). Elles sont donc stables entre redémarrages et AUCUNE variable n'est obligatoire.

**Optionnel (recommandé en production).** Pour figer les clés et ne jamais les perdre (p. ex. si le Persistent Disk est recréé), définissez dans Render → *Environment* :

| Variable | Rôle |
|---|---|
| `VAPID_PUBLIC_KEY` | Clé publique VAPID (base64url) |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (base64url) |
| `VAPID_SUBJECT` | `mailto:contact@mangootech.com` (défaut) |

Générer une paire une fois : `node -e "console.log(require('web-push').generateVAPIDKeys())"`, puis copier les deux valeurs. Si ces variables sont définies, elles priment sur `vapid.json`.

**Limites à connaître.**

- Fiable lorsque le navigateur tourne (onglet fermé ou en arrière-plan).
- iOS : nécessite l'app installée en PWA (Safari iOS 16.4+) ; pas de notification si l'app native est totalement quittée.
- L'appel entrant est éphémère : la notification « réveille » l'utilisateur et ouvre son espace ; la sonnerie WebRTC ne se poursuit que si l'appelant rappelle ou que l'onglet est rouvert assez vite.

---

## G. Évolution future (à planifier)

| Aujourd'hui | Demain |
|---|---|
| `Service → JSON DataStore` (`data/*.json`) | `Service → PostgreSQL DataStore` |
| État temps réel en mémoire (mono-instance) | `Memory → Redis` (pub/sub, multi-instance) |
| Données dans des fichiers | `Fichiers → Object Storage` (pièces jointes, médias) |

La couche d'accès centralisée (`dataPath` / `readJsonFile` / `writeJsonAtomic`) a été préparée pour faciliter la migration PostgreSQL sans changer l'interface utilisateur.

---

## Procédure de déploiement (résumé)

1. S'assurer que le dépôt Git est propre : `.env`, `CREDENTIALS.md`, `key.pem`, `data/users.json`, `data/sessions.json`, `data/transactions.json`, `data/wallets.json`, `data/couriers.json`, `data/deliveries.json` sont ignorés.
2. Render → *New → Web Service* → brancher le dépôt.
3. Build Command `npm install --omit=dev`, Start Command `node server.cjs`.
4. Attacher un Render Disk monté sur `/app/data`.
5. Définir les variables (section B), notamment `DATA_DIR=/app/data` et `NODE_ENV=production`.
6. Déployer puis vérifier `https://<service>.onrender.com/health` → `200`.
7. Brancher Cloudflare (section C) : *Custom Domains* côté Render + `CNAME` proxy côté Cloudflare, TLS **Full (strict)**.
