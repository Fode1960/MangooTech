#!/usr/bin/env bash
# ============================================================
#  Mangoo Connect+ — hook de déploiement certbot (renouvellement)
#  ------------------------------------------------------------
#  Exécuté par certbot APRÈS chaque émission ou renouvellement
#  réussi (variable $RENEWED_LINEAGE fournie par certbot).
#  Recopie fullchain.pem / privkey.pem dans ./certs/ puis
#  redémarre nginx.
#
#  Ce script est appelé automatiquement via --deploy-hook dans
#  install-cert.sh ; il est aussi invoqué par le timer systemd
#  de renouvellement de certbot.
# ============================================================
set -euo pipefail

# $RENEWED_LINEAGE pointe vers /etc/letsencrypt/live/<domaine>
LINEAGE="${RENEWED_LINEAGE:-}"
if [ -z "$LINEAGE" ]; then
  echo "❌ Variable RENEWED_LINEAGE absente. Ce script doit être lancé par certbot."
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CERT_DIR="$ROOT/certs"
COMPOSE=(docker compose -f "$ROOT/docker-compose.yml")

mkdir -p "$CERT_DIR"
cp "$LINEAGE/fullchain.pem" "$CERT_DIR/fullchain.pem"
cp "$LINEAGE/privkey.pem" "$CERT_DIR/privkey.pem"
chmod 600 "$CERT_DIR/privkey.pem"

echo "  → certificats recopiés dans $CERT_DIR"

# Redémarre nginx pour charger le nouveau certificat.
if command -v docker >/dev/null 2>&1; then
  "${COMPOSE[@]}" up -d nginx 2>/dev/null \
    || "${COMPOSE[@]}" restart nginx 2>/dev/null \
    || echo "⚠️  nginx : relance manuelle requise (docker compose up -d nginx)"
else
  echo "⚠️  docker absent : relancez nginx manuellement."
fi

echo "✅ Hook de déploiement terminé."
