# Rapport final — Sécurisation & préparation Render

Projet : **Mangoo Connect+** (`docs/mangoo-ui`)
Date : 2026-08-25
Périmètre : préparer le déploiement Render **sans déployer**, sans casser les fonctionnalités existantes.

---

## 1. Fichiers modifiés

| Fichier | Modifications |
|---|---|
| `server.cjs` | Persistance centralisée (`DATA_DIR`, `dataPath`, `readJsonFile`, `writeJsonAtomic`), écriture JSON atomique, protection des fichiers sensibles (`isSensitiveFile`), paiement DEMO + abstraction `PaymentProvider`, cookies `Secure`, `/health` enrichi, heartbeat WebSocket, logs non sensibles, credentials admin vers `CREDENTIALS.md` en production |
| `assets/mangoo-connect-plus.js` | Reconnexion WebSocket automatique avec backoff progressif |
| `pages/livreur.html` | Reconnexion WebSocket avec backoff progressif |
| `pages/dashboard-delivery.html` | Reconnexion WebSocket avec backoff progressif |
| `.env.example` | Ajout `DATA_DIR`, `BACKUP_ENABLED`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `PAYMENT_MODE` |
| `.gitignore` | Ajout `backups/` |
| `package.json` | Ajout du script `backup` |

## 2. Fichiers créés

| Fichier | Rôle |
|---|---|
| `backup-data.cjs` | Sauvegarde locale horodatée de `DATA_DIR` (gzip, rétention, vérification) |
| `DEPLOIEMENT-RENDER.md` | Procédure de déploiement Render + variables + Cloudflare + backup + paiement + WebSocket |

## 3. Corrections effectuées

| Problème | Solution | Fichier |
|---|---|---|
| Chemins `data/*.json` codés en dur, incompatibles avec `/app/data` | Variable `DATA_DIR` + helpers centraux `dataPath` / `readJsonFile` / `writeJsonAtomic` | `server.cjs` |
| Écriture JSON directe risquant un fichier partiellement écrit | `writeJsonAtomic` (temp + validation + `rename` atomique) ; toutes les écritures y passent | `server.cjs` |
| Traversée de répertoire / exposition des secrets | `isSensitiveFile` (DATA_DIR + `data/`, `.env*`, `CREDENTIALS.md`, `key.pem`, `server.cjs`, `backup-data.cjs`, `*.tmp-*`) + anti-traversal | `server.cjs` |
| Aucune sauvegarde automatisée | `backup-data.cjs` configurable (enabled/dir/rétention) | `backup-data.cjs` |
| WebSocket : pas de détection des connexions mortes | Heartbeat ping/pong 30 s + nettoyage des connexions mortes | `server.cjs` |
| Client sans reconnexion robuste | Backoff progressif 1→16 s, réinitialisé à l'ouverture | `mangoo-connect-plus.js`, `livreur.html`, `dashboard-delivery.html` |
| Paiement simulé mais non explicite | `PAYMENT_MODE=demo`, `DemoPaymentProvider` actif, transactions `mode:"demo"`, libellé « aucune somme réelle n'est débitée » | `server.cjs` |
| Cookie de session sans `Secure` derrière proxy | `sessionCookieFlags` ajoute `Secure` si `X-Forwarded-Proto: https` | `server.cjs` |
| `/health` minimal | Enrichi : env, node, uptime, peers, storage (lecture/écriture), websocket ; 200/503 | `server.cjs` |
| Mot de passe admin possiblement en clair dans les logs | `printAdminSeed` écrit dans `CREDENTIALS.md` (gitignoré) en production | `server.cjs` |
| Identifiants admin par défaut hérités | Rotation automatique (`admin2026`/`0000` neutralisés) | `server.cjs` |

## 4. Tests réalisés

| # | Test | Résultat |
|---|---|---|
| 1 | Syntaxe `node --check` (server.cjs, backup-data.cjs, mangoo-connect-plus.js) | ✅ PASS |
| 2 | Démarrage `node server.cjs` (avec `DATA_DIR` redirigé hors du projet) | ✅ PASS |
| 3 | `/data/users.json`, `/data/admin-config.json`, `/.env`, `/server.cjs`, `/CREDENTIALS.md`, `/backup-data.cjs`, `/key.pem` → 403 | ✅ PASS |
| 4 | `/health` → 200 (ok, storage writable, websocket ok) | ✅ PASS |
| 5 | Paiement : `paymentMode=demo`, initiate + confirm (`mode=demo`, libellé exact) | ✅ PASS |
| 6 | Persistance : création utilisateur/session/transaction/wallet → redémarrage → données préservées | ✅ PASS |
| 7 | Session : `auth/me` avec token antérieur fonctionne après redémarrage | ✅ PASS |
| 8 | WebSocket : connexion, register, ping/pong, chat, présence, nettoyage, reconnexion | ✅ PASS |
| 9 | Backup : archive créée + valide (11 fichiers JSON), `BACKUP_ENABLED=false` désactive proprement | ✅ PASS |
| 10 | Secrets : aucun mot de passe/PIN en clair, `.env` ignoré, aucun secret dans le frontend | ✅ PASS |

## 5. Points restant à traiter

**Bloquant avant déploiement**
- Renseigner `ADMIN_PASSWORD` / `ADMIN_PIN` forts dans Render (sinon générés une fois, à récupérer dans `CREDENTIALS.md`).

**Recommandé mais non bloquant**
- Connecter le backup à un stockage externe (Cloudflare R2 / S3 / Backblaze B2) via un Cron Job Render.
- Remplacer Nominatim (reverse-geocoding) par un géocodeur commercial en cas de trafic réel.

**Évolution future (hors périmètre de cette tâche)**
- Migrer `JSON → PostgreSQL` (couche d'accès déjà préparée).
- Introduire `Redis` pour sortir du mono-instance.
- Implémenter les vrais connecteurs de paiement (Orange Money, Wave, MTN MoMo, Moov, Free) avec API validées, puis `PAYMENT_MODE=live`.

## 6. Configuration Render finale

| Paramètre | Valeur |
|---|---|
| Runtime | Node (Node 20 LTS) |
| Build Command | `npm install --omit=dev` |
| Start Command | `node server.cjs` |
| Port | `8080` |
| Persistent Disk | Oui (1 Go min) |
| Mount Path | `/app/data` |
| Variables | `PORT=8080`, `NODE_ENV=production`, `DATA_DIR=/app/data`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PIN`, `BACKUP_ENABLED=true`, `PAYMENT_MODE=demo` |

## 7. Procédure de déploiement

1. Vérifier que le dépôt Git est propre (secrets et données runtime ignorés).
2. Render → *New → Web Service* → brancher le dépôt.
3. Build Command `npm install --omit=dev`, Start Command `node server.cjs`.
4. Attacher un Render Disk monté sur `/app/data`.
5. Définir les variables (section 6).
6. Déployer, puis vérifier `https://<service>.onrender.com/health` → 200.
7. Cloudflare : *Custom Domains* côté Render + `CNAME` proxy côté Cloudflare (TLS **Full strict**).
