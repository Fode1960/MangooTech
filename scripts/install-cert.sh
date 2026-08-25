#!/usr/bin/env bash
# ============================================================
#  Mangoo Connect+ — installation certificat Let's Encrypt
#  ------------------------------------------------------------
#  S'exécute sur l'HÔTE de production (Linux), pas dans le
#  conteneur. Émet (ou renouvelle) un certificat pour le domaine
#  puis copie fullchain.pem / privkey.pem dans ./certs/ (dossier
#  monté par nginx dans docker-compose.yml).
#
#  Usage :
#    sudo ./scripts/install-cert.sh votre-domaine.com [email]
#
#  Prérequis :
#    - certbot installé :  sudo apt install certbot
#    - docker compose disponible
# ============================================================
set -euo pipefail

DOMAIN="${1:?Usage: install-cert.sh <domaine> [email]}"
EMAIL="${2:-}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT/certs"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")

command -v certbot >/dev/null 2>&1 || {
  echo "❌ certbot introuvable. Installez-le :  sudo apt install certbot"
  exit 1
}

EMAIL_ARG=()
if [ -n "$EMAIL" ]; then
  EMAIL_ARG=(--email "$EMAIL")
else
  EMAIL_ARG=(--register-unsafely-without-email)
fi

LIVE_DIR="/etc/letsencrypt/live/$DOMAIN"
HOOK="$ROOT/scripts/cert-deploy-hook.sh"

copy_certs() {
  mkdir -p "$CERT_DIR"
  cp "$LIVE_DIR/fullchain.pem" "$CERT_DIR/fullchain.pem"
  cp "$LIVE_DIR/privkey.pem" "$CERT_DIR/privkey.pem"
  chmod 600 "$CERT_DIR/privkey.pem"
  echo "  → certificats copiés dans $CERT_DIR"
}

# Le challenge HTTP (standalone) a besoin du port 80, occupé par nginx.
echo "▶ Arrêt temporaire de nginx (port 80)…"
"${COMPOSE[@]}" stop nginx 2>/dev/null || true

restart_nginx() {
  echo "▶ Redémarrage de nginx…"
  "${COMPOSE[@]}" up -d nginx 2>/dev/null || true
}
trap restart_nginx EXIT

echo "▶ Émission / renouvellement du certificat pour $DOMAIN…"
certbot certonly \
  --standalone \
  --preferred-challenges http \
  --agree-tos \
  --non-interactive \
  "${EMAIL_ARG[@]}" \
  -d "$DOMAIN" \
  --cert-name mangoo-nginx \
  --deploy-hook "$HOOK"

copy_certs

echo "✅ Terminé. nginx est redémarré avec le nouveau certificat."
echo "   Renouvellement : certbot renouvelle automatiquement via le timer systemd."
echo "   La re-copie des certificats et le rechargement nginx sont automatisés"
echo "   par le --deploy-hook ($HOOK)."
