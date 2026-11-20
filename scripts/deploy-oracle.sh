#!/usr/bin/env bash
# One-command deploy / update script for Oracle Cloud Always-Free Ubuntu VM.
# Usage:
#   bash scripts/deploy-oracle.sh                 # HTTP on :8787
#   bash scripts/deploy-oracle.sh api.example.com # Auto-HTTPS via Caddy
set -euo pipefail

DOMAIN="${1:-}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> [1/4] Checking Node.js 20, pnpm & PM2..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential
fi
sudo corepack enable
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> [2/4] Installing dependencies & building @astro/api..."
cd "$REPO_DIR"
mkdir -p data
[ -f .env ] || cp .env.example .env
pnpm install --frozen-lockfile
pnpm --filter @astro/api build

echo "==> [3/4] Starting / reloading kundliflow-api via PM2..."
if pm2 describe kundliflow-api >/dev/null 2>&1; then
  pm2 restart kundliflow-api --update-env
else
  pm2 start apps/api/dist/index.js --name kundliflow-api --cwd "$REPO_DIR"
fi
pm2 save

if [ -n "$DOMAIN" ]; then
  echo "==> [4/4] Configuring free automatic HTTPS via Caddy for $DOMAIN..."
  if ! command -v caddy >/dev/null 2>&1; then
    sudo apt-get install -y caddy
  fi
  printf "%s {\n    reverse_proxy localhost:8787\n}\n" "$DOMAIN" | sudo tee /etc/caddy/Caddyfile >/dev/null
  sudo systemctl reload caddy
  echo "Done! API live at: https://$DOMAIN"
else
  echo "==> [4/4] Done! API live on http://localhost:8787 (pass a domain arg for automatic HTTPS)."
fi
