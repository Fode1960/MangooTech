# Déploiement — Mangoo Connect+

Ce document décrit comment configurer et déployer le serveur temps réel
`server.cjs` (interface d'administration + pages publiques + signalisation
WebRTC) en production.

---

## 1. Prérequis

- **Node.js 18 LTS** ou plus récent (le serveur utilise `crypto.scrypt`,
  `crypto.randomUUID` et les WebSockets).
- La dépendance externe **`ws`** (WebSocket). Elle n'est pas listée dans un
  `package.json` local au dossier `mangoo-ui` ; assurez-vous qu'elle est
  disponible :

  ```powershell
  cd mangoo-ui
  npm init -y
  npm install ws
  ```

- Les certificats TLS `cert.pem` et `key.pem` présents dans `mangoo-ui`
  (voir section 3). Sans eux, le serveur tourne en HTTP seul et le forçage
  HTTPS de l'espace admin reste inactif.

---

## 2. Configuration `.env`

Le serveur lit un fichier `.env` situé dans le dossier `mangoo-ui` au
démarrage. Un modèle est fourni dans `.env.example` :

```powershell
copy .env.example .env
```

Variables reconnues :

| Variable            | Défaut                  | Rôle |
|---------------------|-------------------------|------|
| `PORT`              | `8080`                  | Port HTTP (pages publiques + WebRTC) |
| `HTTPS_PORT`        | `8443`                  | Port HTTPS |
| `ADMIN_EMAIL`       | `admin@mangootech.com`  | E-mail du compte admin initial |
| `ADMIN_PASSWORD`    | *(vide)*                | Mot de passe admin ; vide = génération aléatoire affichée une fois |
| `ADMIN_PIN`         | *(vide)*                | PIN admin à 4 chiffres ; vide = génération aléatoire affichée une fois |
| `FORCE_HTTPS_ADMIN` | `true`                  | Force le HTTPS sur l'espace admin |

Points importants :

- **Ne commettez jamais `.env`** dans Git : ajoutez-le à `.gitignore`.
  Seul `.env.example` doit être versionné.
- Si `ADMIN_PASSWORD` / `ADMIN_PIN` sont laissés vides, des secrets forts
  sont générés et affichés **une seule fois** dans les logs de démarrage.
  Pour un déploiement contrôlé, fixez-les explicitement dans `.env`.
- Une variable déjà présente dans l'environnement du processus n'est pas
  écrasée par `.env`.

### 2.1 Environnement de test / CI

Un fichier `.env.test` fournit des valeurs non sensibles réservées aux
environnements jetables (intégration continue, tests de fumée). Le forçage
HTTPS y est désactivé (`FORCE_HTTPS_ADMIN=false`) car la CI n'a pas de
certificat :

```bash
cp .env.test .env
node server.cjs
```

Ou injectez directement ces variables dans le runner CI (le serveur ne lit
que le fichier `.env`, pas `.env.test`).

---

## 3. Certificats TLS

L'espace admin est accessible en HTTPS dès que `cert.pem` et `key.pem`
existent dans le dossier `mangoo-ui`.

- **Développement** : un certificat auto-signé suffit. Accès local via
  `https://localhost:8443` (avertissement de navigateur à accepter).
- **Production** : remplacez `cert.pem` / `key.pem` par un certificat signé
  (Let's Encrypt ou autorité de confiance), en conservant exactement ces
  noms de fichiers.

Exemple de génération d'un certificat auto-signé (dev uniquement) :

```powershell
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout key.pem -out cert.pem -days 365 \
  -subj "/CN=localhost"
```

### 3.1 Certificat Let's Encrypt (production)

Un script prêt à l'emploi émet (ou renouvelle) un certificat pour le domaine
puis copie `fullchain.pem` / `privkey.pem` dans `./certs/` (dossier monté
par nginx) :

```bash
sudo ./scripts/install-cert.sh votre-domaine.com admin@votre-domaine.com
```

Le script arrête temporairement nginx (le challenge HTTP a besoin du port 80),
émet le certificat via `certbot certonly --standalone`, copie les fichiers,
puis redémarre nginx. Prérequis : `certbot` (`sudo apt install certbot`).

> Renouvellement : certbot renouvelle automatiquement via le timer systemd.
> La re-copie des certificats dans `./certs/` et le rechargement de nginx sont
> automatisés grâce au `--deploy-hook` (script `scripts/cert-deploy-hook.sh`),
> déclaré à l'émission du certificat. Aucune action manuelle n'est requise
> après un renouvellement.

---

## 4. Lancement

### 4.1 Local (développement)

```powershell
cd mangoo-ui
node server.cjs
```

Ou double-clic sur `start-server.cmd`. Les URLs s'affichent au démarrage :

```text
HTTP  : http://localhost:8080
HTTPS : https://localhost:8443
```

### 4.2 Production (recommandé)

Utilisez un gestionnaire de processus pour la supervision et le redémarrage
automatique.

**Option A — PM2** :

```powershell
npm install -g pm2
cd mangoo-ui
pm2 start server.cjs --name mangoo-connect --max-memory-restart 300M
pm2 save
pm2 startup   # puis exécuter la commande affichée
```

**Option B — systemd (Linux)** : créer
`/etc/systemd/system/mangoo-connect.service` :

```ini
[Unit]
Description=Mangoo Connect+ (temps réel)
After=network.target

[Service]
WorkingDirectory=/opt/mangoo-ui
ExecStart=/usr/bin/node server.cjs
Restart=always
RestartSec=3
EnvironmentFile=/opt/mangoo-ui/.env
User=mangoo

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mangoo-connect
```

---

## 5. Exposition réseau & reverse proxy

Le serveur écoute sur `0.0.0.0` (HTTP `8080`, HTTPS `8443`). Deux cas :

### 5.1 Terminaison TLS par le serveur Node (simple)

Exposez directement les ports `8080` et `8443` (ou faites pointer un
équilibreur de charge TCP sur ces deux ports). Le forçage HTTPS admin
fonctionne nativement : les requêtes admin en clair reçoivent `426`/`301`.

### 5.2 Terminaison TLS par un reverse proxy (Nginx/Caddy)

> ⚠️ **Point de vigilance.** La détection de requête sécurisée repose sur
> la connexion chiffrée du serveur Node (`req.socket.encrypted`). Si le TLS
> est terminé en amont (proxy → `8080` en clair), le serveur croit recevoir
> du HTTP et renvoie `426`/`301` sur l'espace admin.

Dans ce cas, deux solutions :

1. **Recommandé** : laisser le proxy relayer vers le **port HTTPS `8443`**
   du serveur (le proxy et le serveur parlent tous deux en TLS), ou
2. Faire respecter HTTPS exclusivement au niveau du proxy et définir
   `FORCE_HTTPS_ADMIN=false` dans `.env` (le proxy devient alors l'unique
   garant du chiffrement).

Exemple Nginx minimal (terminaison TLS côté proxy, option 2) :

```nginx
server {
    listen 443 ssl;
    server_name admin.votre-domaine.com;
    ssl_certificate     /etc/letsencrypt/live/votre-domaine/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # WebSocket (signalisation WebRTC)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. Sécurité

- **Identifiants admin** : aucun secret n'est codé en dur. Au premier
  démarrage, le compte admin est créé à partir de `.env` (ou de secrets
  générés affichés une fois). Les identifiants par défaut historiques
  (`admin2026` / `0000`) sont automatiquement neutralisés (rotation).
- **Sessions** : les anciennes sessions admin obsolètes doivent être purgées
  lors d'une rotation d'identifiants (fichier `data/sessions.json`).
- **Forçage HTTPS** : actif par défaut dès que les certificats sont présents.
- **Accès API admin** : strictement protégé par un token Bearer et le rôle
  `admin`.

---

## 7. Vérifications après déploiement

```powershell
# 1. Forçage HTTPS (API admin en HTTP doit renvoyer 426)
curl.exe -s -i http://localhost:8080/api/admin/transactions

# 2. Redirection page admin (HTTP -> 301 vers https://...:8443)
curl.exe -s -i http://localhost:8080/pages/admin.html

# 3. Connexion admin en HTTPS puis accès à l'API
curl.exe -k -s -X POST https://localhost:8443/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"mode\":\"password\",\"identifier\":\"admin@mangootech.com\",\"secret\":\"VOTRE_MOT_DE_PASSE\"}"
```

Vérifiez aussi : l'export CSV
(`/api/admin/transactions?export=csv`) et l'évolution des commissions
(`/api/admin/commissions/evolution?days=30`) répondent en `200` avec un
token admin valide.

---

## 8. Récapitulatif des fichiers

| Fichier | Rôle |
|---------|------|
| `server.cjs` | Serveur temps réel (HTTP + HTTPS + WebSocket) |
| `.env.example` | Modèle de variables d'environnement |
| `.env` | Configuration réelle (secret, non versionné) |
| `cert.pem` / `key.pem` | Certificat et clé privée TLS |
| `start-server.cmd` | Lanceur Windows (dev) |
| `data/*.json` | Données persistées (utilisateurs, sessions, transactions…) |
