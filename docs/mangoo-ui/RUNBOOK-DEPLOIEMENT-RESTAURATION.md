# Runbook — Déploiement & Restauration Mangoo Connect+

> Document opérationnel pour l'équipe Mangoo · Septembre 2026
> Concerne : activation du paiement réel (Wave + Orange Money), bascule de l'UI, sauvegarde/restauration (locale + externe R2/S3), rollback, réconciliation.

---

## 1. Contexte de production

- **Branche déployée** : `main` (déclenche le déploiement Render automatiquement au push).
- **Domaine** : `https://www.mangoo.tech` (la racine `mangoo.tech` redirige en 301 vers `www.`).
- **Runtime** : Node `v26.x`, déploiement Render + Cloudflare.
- **Données** : fichiers JSON sous `DATA_DIR` (`/app/data` en production).
- **Paiement** : abstraction `PaymentProvider` dans `server.cjs`. Mode `demo` par défaut, `live` quand `PAYMENT_MODE=live`. Deux opérateurs branchés en réel : **Wave** et **Orange Money** (checkout redirect).

---

## 2. Activer le paiement réel (Wave + Orange Money)

### 2.1 Prérequis (une seule fois, hors code)

**Wave (Sénégal)**

1. Ouvrir un **compte Wave Business** : KYB (NINEA, RCCM, pièce d'identité du gérant, justificatif d'adresse). Délai indicatif 5–10 jours ouvrés.
2. Dans le **Wave Business Portal** → *Developer*, créer une **API key** (format `wave_sn_prod_...`). La clé n'est affichée qu'une fois.
3. Récupérer (si activé) le **secret de signature des webhooks** (`whsec_...`).

**Orange Money (API Orange)**

1. Ouvrir un **compte marchand Orange Money / Orange Developer** et souscrire l'API *Web Payment*.
2. Récupérer `consumer key` (client_id), `consumer secret` (client_secret) et la **merchant key**.
3. Générer un **token de notification** (`notif_token`) pour sécuriser les webhooks serveur→serveur.

### 2.2 Variables d'environnement (Render → Environment)

Ajouter sur le service Render :

**Wave**

| Variable | Valeur | Requis |
|---|---|---|
| `PAYMENT_MODE` | `live` | Oui (sinon tout reste en démo) |
| `WAVE_API_KEY` | votre clé `wave_sn_prod_...` | Oui |
| `WAVE_API_BASE` | `https://api.wave.com` | Non (défaut) |
| `WAVE_WEBHOOK_SECRET` | `whsec_...` | Oui (webhooks) |
| `WAVE_SIGNING_SECRET` | secret de signature requête | Non (si activé sur la clé) |

**Orange Money**

| Variable | Valeur | Requis |
|---|---|---|
| `ORANGE_MONEY_CLIENT_ID` | consumer key (API Orange) | Oui |
| `ORANGE_MONEY_CLIENT_SECRET` | consumer secret | Oui |
| `ORANGE_MONEY_MERCHANT_KEY` | merchant key | Oui |
| `ORANGE_MONEY_NOTIF_TOKEN` | token de notification | Oui (webhook) |
| `ORANGE_MONEY_API_BASE` | `https://api.orange.com/orange-money-webpay/dev/v1` | Non (défaut) |

> Règle de bascule : un opérateur n'est `live` que si `PAYMENT_MODE=live` **et** ses clés sont présentes. Sans clé, il reste en `demo`, sans risque de débit réel.

### 2.3 Tester en sandbox avant le live

1. Pointer les bases API vers les environnements sandbox fournis (Wave et/ou Orange) ; l'URL exacte dépend de votre compte.
2. Créer une session de petit montant (`100 XOF`) via `POST /api/payment/checkout/session` avec `operator: "wave"` (ou `"orange"`).
3. Suivre la redirection, puis interroger `GET /api/payment/checkout/status?txn=<transactionId>`.
4. Valider le webhook correspondant (`/api/payment/wave/webhook` ou `/api/payment/orange/webhook`) et sa signature/token.

### 2.4 Passage en production réelle

Une fois le sandbox validé : remettre les bases API de production, redéployer, puis faire **un paiement réel de petit montant** en surveillant le dashboard. Consulter au préalable la **section 7** (points de vigilance) : le settlement des effets de bord doit être bouclé avant tout encaissement réel.

---

## 3. Flux de paiement : démo vs redirect live

### 3.1 Flux démo (inchangé)

Modal 3 étapes (opérateur → numéro → OTP), tout simulé, **aucun débit réel**. Utilisé tant que `PAYMENT_MODE ≠ live` **ou** pour un opérateur sans clé.

### 3.2 Flux redirect live (Wave + Orange Money)

Wave et Orange Money n'utilisent **pas** d'OTP : ce sont des *checkouts redirect* (page hébergée par l'opérateur).

1. L'UI détecte un opérateur `live` et appelle `POST /api/payment/checkout/session` (enregistre la transaction `initiated`, renvoie `checkoutUrl`).
2. L'UI **redirige** l'utilisateur vers `checkoutUrl` (plus de modal OTP).
3. L'opérateur notifie via **webhook** (Wave `whsec`, Orange `notif_token`) **ou** l'app poll le statut au retour (`?mgt_checkout=1`).
4. `GET /api/payment/checkout/status?txn=...` lit le statut et clôture la transaction.

### 3.3 Endpoints implémentés

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/payment/operators` | GET | Liste des opérateurs + mode `demo`/`live` |
| `/api/payment/mobile-money/initiate` | POST | Flux démo 3 étapes (initiation) |
| `/api/payment/mobile-money/confirm` | POST | Flux démo 3 étapes (confirmation OTP) |
| `/api/payment/checkout/session` | POST | Crée la transaction + renvoie `checkoutUrl` (Wave **et** Orange) |
| `/api/payment/checkout/status` | GET | Poll le statut et clôture (`?txn=`) |
| `/api/payment/wave/session` | POST | Endpoint spécifique Wave (legacy, conservé) |
| `/api/payment/wave/status` | GET | Statut spécifique Wave (polling) |
| `/api/payment/wave/webhook` | POST | Notification Wave (signature vérifiée) |
| `/api/payment/orange/webhook` | POST | Notification Orange (`notif_token` vérifié) |

> L'UI (`assets/mangoo-payment.js`) utilise désormais le **checkout générique** (`/checkout/session` + `/checkout/status`) pour les opérateurs `live` ; les opérateurs `demo` conservent la modal OTP.

---

## 4. Sauvegarde & restauration des données

### 4.1 Sauvegarde locale

`node backup-data.cjs` produit une archive gzip horodatée `mangoo-backup-<date>.json.gz` dans `BACKUP_DIR` (défaut `<DATA_DIR>/backups`), rétention 7 jours. Config : `BACKUP_ENABLED=true` + Render Cron Job.

### 4.2 Sauvegarde externe (Cloudflare R2 / S3 / B2)

Active la copie de chaque archive vers un bucket S3-compatible (upload signé AWS SigV4), pour survivre à la perte complète du Persistent Disk.

| Variable | Valeur | Requis |
|---|---|---|
| `BACKUP_EXTERNAL` | `true` | Oui (active l'upload) |
| `BACKUP_S3_ENDPOINT` | ex. `https://<account>.r2.cloudflarestorage.com` | Oui |
| `BACKUP_S3_BUCKET` | nom du bucket (défaut `mangoo-backups`) | Oui |
| `BACKUP_S3_REGION` | `auto` (R2) ou région AWS/B2 | Non |
| `BACKUP_S3_ACCESS_KEY_ID` | clé d'accès | Oui |
| `BACKUP_S3_SECRET_ACCESS_KEY` | secret d'accès | Oui |

À chaque exécution, le script upload : l'archive horodatée **et** `latest.json.gz` (pointeur vers la dernière sauvegarde).

### 4.3 Restauration depuis le disque local

1. Lister les archives : `ls /app/data/backups/`.
2. Choisir l'archive cible, ex. `mangoo-backup-2026-09-08T10-00-00.000Z.json.gz`.
3. Décompresser : `gzip -dk <archive>` → obtient le JSON.
4. Extraire les fichiers : le JSON contient `{ files: { "users.json": "...", ... } }`.
5. **Stopper le serveur** (éviter les écritures concurrentes).
6. Remplacer le contenu de `DATA_DIR` par les fichiers extraits (ne garder que les `.json`).
7. Redémarrer le serveur et vérifier `/health`.

### 4.4 Restauration depuis le bucket externe

1. Télécharger `latest.json.gz` (ou l'archive horodatée voulue) depuis le bucket via le CLI/console du fournisseur (R2, AWS, B2).
2. Reprendre les étapes 3 à 7 de la section 4.3.

> **Testez une restauration réelle (locale et externe) au moins une fois par mois.** Une sauvegarde non testée n'est pas une sauvegarde.

---

## 5. Rollback du déploiement

1. Identifier le dernier commit stable : `git log --oneline -5`.
2. Revenir dessus : `git revert <commit>` (recommandé, préserve l'historique) ou `git reset --hard <commit>` puis `git push --force` (à éviter en prod).
3. Pousser : `git push origin main` → Render redéploie.
4. Vérifier `/health` et l'accueil.

> Le rollback du paiement est sûr : si on repasse `PAYMENT_MODE=demo`, aucun débit réel n'est possible, quel que soit le code déployé.

---

## 6. Checklist de vérification post-déploiement

- [ ] `GET /health` → `200`, `env: production`.
- [ ] `GET /api/payment/operators` → Wave et Orange affichent `mode: demo` (ou `live` si configuré).
- [ ] `POST /api/payment/checkout/session` → `400` propre sans clé (garde-fou).
- [ ] Aucune régression du flux démo (commande/recharge simulée, modal OTP).
- [ ] Logs Render : absence de `ReferenceError`/`TypeError` au démarrage.
- [ ] Backup local OK (`BACKUP_ENABLED=true`) ; upload externe OK (`BACKUP_EXTERNAL=true`).

---

## 7. Points de vigilance production

**Settlement des effets de bord (résolu).** Le checkout redirect live applique désormais les effets de bord métier via `settleTransaction(txn)` dans `server.cjs`, déclenché depuis `/checkout/status`, le webhook Orange et les endpoints Wave (status + webhook). Branches couvertes : crédit portefeuille (`topup`), publication/renouvellement de l'offre du jour (`offre-jour`, `offre-jour-renouvellement`), paiement de négociation (`negotiation-payment`), activation/renouvellement des boosters (`booster`, `booster-renew`). Les appelants transmettent `kind` + `meta` (via `assets/mangoo-payment.js`) et le checkout générique stocke `meta` sur la transaction.

**Idempotence.** Le settlement est gardé par le flag `txn.settled` : un double webhook ou un double poll ne peut pas entraîner de double crédit ni de double activation.

**Limite boutique (à traiter avant de l'activer en live).** Le paiement de commande sur la fiche boutique (`fiche-boutique.html`) ne crée aucune commande côté serveur ; en redirect live, le paiement serait encaissé sans commande à rapprocher. Ce flux reste hors périmètre du présent settlement et doit faire l'objet d'une implémentation dédiée (endpoint de commande + settlement) avant activation en `live`.

**Réconciliation (recommandé).** Mettre en place un job quotidien qui rapproche les transactions `initiated`/`pending` du statut réel Wave/Orange et ferme les orphelines (`failed`/`expired`).

---

## 8. Fichiers modifiés (synthèse)

| Fichier | Changement |
|---|---|
| `docs/mangoo-ui/wave-payment.cjs` | Provider Wave (checkout + webhook + signature) |
| `docs/mangoo-ui/orange-money.cjs` | Provider Orange Money (OAuth2 + webpayment + notification) |
| `docs/mangoo-ui/server.cjs` | `paymentProviderFor(op)`, endpoints génériques `/checkout/session` + `/checkout/status`, webhook `/orange/webhook` |
| `docs/mangoo-ui/assets/mangoo-payment.js` | Bascule UI : redirection vers `checkoutUrl` (Wave/OM live) au lieu de la modal OTP |
| `docs/mangoo-ui/backup-data.cjs` | Upload externe S3-compatible (SigV4) + `latest.json.gz` |
| `docs/mangoo-ui/.env.example` | Variables `WAVE_*`, `ORANGE_MONEY_*`, `BACKUP_EXTERNAL`/`BACKUP_S3_*` documentées |
