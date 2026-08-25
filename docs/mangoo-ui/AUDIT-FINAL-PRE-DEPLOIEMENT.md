# Audit final pré-déploiement Render — Mangoo Connect+

Date : 2026-08-25
Objet : dernier audit technique + corrections bloquantes avant le premier déploiement Render. Aucune refonte, pas de PostgreSQL/Redis, pas de vrai paiement, pas de déploiement.

---

## A. AUDIT — points vérifiés

| # | Point | Verdict |
|---|---|---|
| 1 | Credentials admin (env-only en production, aucun secret sur disque/logs/Git) | ✅ Corrigé et validé |
| 2 | Persistent Disk (`DATA_DIR=/app/data`, aucun chemin `./data` codé en dur) | ✅ Conforme |
| 3 | Backup (`BACKUP_DIR` sur emplacement persistant) | ✅ Corrigé et validé |
| 4 | Paiement `PAYMENT_MODE=demo`, transactions `mode:"demo"`, libellé explicite | ✅ Conforme |
| 5 | WebSocket heartbeat 30 s, nettoyage, reconnexion backoff, mono-instance | ✅ Conforme |
| 6 | `GET /health` (200, storage read/write, aucun secret) | ✅ Conforme |
| 7 | Sécurité fichiers (403, path traversal, exposition env) | ✅ Conforme |
| 8 | HTTPS + Cloudflare (`X-Forwarded-Proto`, cookie `Secure`, `FORCE_HTTPS_ADMIN`) | ✅ Conforme |
| 9 | Configuration Render (Node 20, build/start, port, disk, mount, instance) | ✅ Conforme |

## B. MODIFICATIONS (cet audit)

| Fichier | Modification | Pourquoi |
|---|---|---|
| `server.cjs` | `printAdminSeed` ne journalise plus / n'écrit plus aucun secret en production | Interdiction de persister un secret admin sur disque ou dans les logs |
| `server.cjs` | Ajout `assertProductionAdminCredentials()` : en production, exige `ADMIN_PASSWORD` + `ADMIN_PIN` (sinon `process.exit(1)`) | Credentials fournis uniquement par les variables Render |
| `server.cjs` | `rotateLegacyAdminCredentials()` : pas de génération aléatoire en production | Même politique : aucun secret auto-généré |
| `server.cjs` | `loadUsers()` : appel de la garde avant le seed admin | Bloque le démarrage avant toute génération |
| `backup-data.cjs` | `BACKUP_DIR` par défaut → `<DATA_DIR>/backups` | Archives sur le Persistent Disk, pas dans l'espace éphémère |
| `.env.example` | `BACKUP_DIR` vide (défaut `<DATA_DIR>/backups`) + note credentials obligatoires en prod | Cohérence + documentation |
| `.gitignore` | Ajout `.env.*` | Exclure tout fichier d'environnement de Git |
| `DEPLOIEMENT-RENDER.md` | Sections B et D mises à jour (credentials, backup persistant) | Refléter le nouvel état |

## C. TESTS

| # | Test | Résultat |
|---|---|---|
| 1 | Syntaxe `node --check` (server.cjs, backup-data.cjs) | ✅ PASS |
| 2 | `GET /health` en production → HTTP 200 | ✅ PASS |
| 3 | `DATA_DIR` lecture/écriture (sonde health) | ✅ PASS |
| 4 | Persistance (données créées puis relues après redémarrage) | ✅ PASS |
| 5 | Backup : archive créée sous `<DATA_DIR>/backups`, non vide | ✅ PASS |
| 6 | WebSocket : connexion, ping/pong, présence, reconnexion | ✅ PASS |
| 7 | Paiement : `paymentMode=demo`, tous opérateurs `mode:"demo"`, aucun appel réel | ✅ PASS |
| 8 | Sécurité : 403 sur `users/sessions/transactions/wallets.json`, `.env*`, `CREDENTIALS.md`, `backup-data.cjs` | ✅ PASS |
| 9 | Secrets : aucun secret dans Git ni le frontend | ✅ PASS |
| 10 | Production : démarrage OK avec credentials ; **refus propre (exit 1) sans credentials** | ✅ PASS |
| 11 | Cookie de session : `HttpOnly; SameSite=Lax; Secure` derrière `X-Forwarded-Proto: https` | ✅ PASS |

## D. CONFIGURATION RENDER FINALE

| Paramètre | Valeur |
|---|---|
| Runtime | Node 20 LTS |
| Build Command | `npm install --omit=dev` |
| Start Command | `node server.cjs` |
| Port | `8080` |
| Instance | Starter (1 seule instance) |
| Persistent Disk | 1 Go minimum |
| Mount Path | `/app/data` |

## E. VARIABLES D'ENVIRONNEMENT (noms uniquement)

`NODE_ENV`, `PORT`, `DATA_DIR`, `FORCE_HTTPS_ADMIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PIN`, `ADMIN_PASSWORD_RESET`, `ADMIN_PIN_RESET`, `BACKUP_ENABLED`, `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `PAYMENT_MODE`.

Valeurs recommandées en production : `NODE_ENV=production`, `PORT=8080`, `DATA_DIR=/app/data`, `FORCE_HTTPS_ADMIN=true`, `BACKUP_ENABLED=true`, `BACKUP_RETENTION_DAYS=7`, `PAYMENT_MODE=demo`. `BACKUP_DIR` peut rester vide (défaut = `/app/data/backups`).

## F. POINTS BLOQUANTS

Aucun point bloquant dans le code. Action obligatoire côté Render au moment du déploiement : définir `ADMIN_PASSWORD` et `ADMIN_PIN` forts — sinon le serveur refuse de démarrer en production (comportement voulu).

## G. POINTS NON BLOQUANTS (évolution future)

- Envoyer les sauvegardes vers un stockage externe (Cloudflare R2 / S3 / Backblaze B2).
- Migrer `JSON → PostgreSQL`.
- Introduire `Redis` pour sortir du mono-instance.
- Implémenter les vrais connecteurs de paiement, puis `PAYMENT_MODE=live`.
- Remplacer Nominatim (reverse-geocoding) en cas de trafic réel.

## H. VERDICT FINAL

**PRÊT À DÉPLOYER SOUS RÉSERVE DE :** définir `ADMIN_PASSWORD` et `ADMIN_PIN` forts dans les variables d'environnement Render (obligatoires en production, aucun secret ne sera généré automatiquement).
