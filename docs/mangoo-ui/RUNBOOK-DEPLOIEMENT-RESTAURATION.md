# Runbook — Déploiement & Restauration Mangoo Connect+

> Document opérationnel pour l'équipe Mangoo · Septembre 2026
> Concerne : activation du paiement Wave réel, sauvegarde/restauration, rollback, réconciliation.

---

## 1. Contexte de production

- **Branche déployée** : `main` (déclenche le déploiement Render automatiquement au push).
- **Domaine** : `https://www.mangoo.tech` (la racine `mangoo.tech` redirige en 301 vers `www.`).
- **Runtime** : Node `v26.x`, déploiement Render + Cloudflare.
- **Données** : fichiers JSON sous `DATA_DIR` (`/app/data` en production).
- **Paiement** : abstraction `PaymentProvider` dans `server.cjs`. Mode `demo` par défaut, `live` quand `PAYMENT_MODE=live`.

---

## 2. Activer le paiement Wave réel

### 2.1 Prérequis (une seule fois, hors code)

1. Ouvrir un **compte Wave Business** (Sénégal) : KYB (NINEA, RCCM, pièce d'identité du gérant, justificatif d'adresse). Délai indicatif 5–10 jours ouvrés.
2. Dans le **Wave Business Portal** → section *Developer*, créer une **API key** (format `wave_sn_prod_...`). La clé n'est affichée qu'une fois.
3. Récupérer (si activé) le **secret de signature des webhooks** (`whsec_...`) et le **secret de signature des requêtes** (optionnel).

### 2.2 Variables d'environnement (Render → Environment)

Ajouter sur le service Render :

| Variable | Valeur | Requis |
|---|---|---|
| `PAYMENT_MODE` | `live` | Oui (sinon tout reste en démo) |
| `WAVE_API_KEY` | votre clé `wave_sn_prod_...` | Oui |
| `WAVE_API_BASE` | `https://api.wave.com` | Non (défaut) |
| `WAVE_WEBHOOK_SECRET` | `whsec_...` | Oui (pour les webhooks) |
| `WAVE_SIGNING_SECRET` | secret de signature requête | Non (si activé sur la clé) |

> Règle de bascule : un opérateur n'est `live` que si `PAYMENT_MODE=live` **et** sa clé est présente. Sans clé, Wave reste en `demo`, sans risque de débit.

### 2.3 Tester en sandbox avant le live

1. Pointer `WAVE_API_BASE` vers l'environnement sandbox fourni par Wave (l'URL exacte dépend de votre compte ; la confirmer auprès de Wave).
2. Créer une session avec un petit montant (`100 XOF`) via `POST /api/payment/wave/session`.
3. Vérifier la redirection, puis le statut via `GET /api/payment/wave/status?sessionId=...`.
4. Valider le webhook (voir 3.3) et la signature HMAC.

### 2.4 Passage en production réelle

Une fois le sandbox validé : remettre `WAVE_API_BASE=https://api.wave.com`, redéployer, puis faire **un paiement réel de petit montant** en surveillant le dashboard.

---

## 3. Flux de paiement Wave (nouveau) vs démo

### 3.1 Flux démo (existant, inchangé)

Modal 3 étapes (opérateur → numéro → OTP), tout simulé, **aucun débit réel**. Utilisé tant que `PAYMENT_MODE` ≠ `live`.

### 3.2 Flux Wave réel (redirect)

Wave n'utilise **pas** d'OTP : c'est un *checkout redirect*.

1. `POST /api/payment/wave/session` — crée la session et renvoie `{ transaction, checkoutUrl }`.
2. Le client **redirige** l'utilisateur vers `checkoutUrl`.
3. Wave notifie via **webhook** (ou l'app poll le statut).
4. `GET /api/payment/wave/status?sessionId=...` — lit le statut et clôture la transaction.

### 3.3 Endpoints Wave (implémentés)

| Endpoint | Méthode | Rôle |
|---|---|---|
| `/api/payment/wave/session` | POST | Crée la session, renvoie `checkoutUrl` |
| `/api/payment/wave/status` | GET | Lit le statut (polling) |
| `/api/payment/wave/webhook` | POST | Confirme le paiement (signature vérifiée) |

### 3.4 RESTE À FAIRE (côté client)

Le module serveur est prêt, mais **l'UI doit encore basculer** : remplacer la modal OTP par une **redirection** vers `checkoutUrl` quand l'opérateur est `wave` en `live`. Sans cela, le paiement réel ne se déclenche pas depuis l'interface (le serveur, lui, est prêt et testable par API).

Points d'impact UI : `pages/checkout.html`, `pages/dashboard-finances.html`, `assets/mangoo-payment.js`, recharge portefeuille (`/api/wallet/topup`), offre du jour.

---

## 4. Sauvegarde & restauration des données

### 4.1 Sauvegarde (actuel)

`node backup-data.cjs` produit une archive gzip horodatée `mangoo-backup-<date>.json.gz` dans `BACKUP_DIR` (défaut `<DATA_DIR>/backups`), rétention 7 jours. Config : `BACKUP_ENABLED=true` + Render Cron Job.

### 4.2 Restauration

1. Lister les archives : `ls /app/data/backups/`.
2. Choisir l'archive cible, ex. `mangoo-backup-2026-09-08T10-00-00.000Z.json.gz`.
3. Décompresser : `gzip -dk <archive>` → obtient le JSON.
4. Extraire les fichiers : le JSON contient `{ files: { "users.json": "...", ... } }`.
5. **Stopper le serveur** (éviter les écritures concurrentes).
6. Remplacer le contenu de `DATA_DIR` par les fichiers extraits (ne garder que les `.json`).
7. Redémarrer le serveur et vérifier `/health`.

> **À faire (Phase 0)** : ajouter l'upload externe R2/S3 (variables `BACKUP_S3_*`) pour que la sauvegarde survive à la perte du Persistent Disk, et **tester une restauration réelle** au moins une fois par mois.

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
- [ ] `GET /api/payment/operators` → Wave affiche `mode: demo` (ou `live` si configuré).
- [ ] `GET /api/payment/wave/session` → `400` propre sans clé (garde-fou).
- [ ] Aucune régression du flux démo (commande/recharge simulée).
- [ ] Logs Render : absence de `ReferenceError`/`TypeError` au démarrage.

---

## 7. Réconciliation (recommandé)

Mettre en place un job quotidien qui rapproche les transactions `initiated`/`pending` du statut réel Wave, et ferme les orphelines (`failed`/`expired`). Vérifier l'**idempotence** : un double webhook ne doit jamais entraîner un double crédit.

---

## 8. Fichiers modifiés (synthèse)

| Fichier | Changement |
|---|---|
| `docs/mangoo-ui/wave-payment.cjs` | Nouveau module Wave (checkout + webhook + signature) |
| `docs/mangoo-ui/server.cjs` | Require défensif, `paymentProviderFor(op)`, 3 endpoints `/api/payment/wave/*` |
| `docs/mangoo-ui/.env.example` | Variables `WAVE_*` documentées |
