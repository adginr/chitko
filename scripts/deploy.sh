#!/usr/bin/env bash
# Pull, install, migrate, build, and restart chitko on the server (Linux).
# For Windows, use scripts/deploy.ps1 instead.
# First-time setup: see DEPLOY.md. Requires a working systemd unit
# named "chitko" (see deploy/chitko.service) unless DEPLOY_RESTART_CMD
# is overridden below.
set -euo pipefail

cd "$(dirname "$0")/.."

RESTART_CMD="${DEPLOY_RESTART_CMD:-sudo systemctl restart chitko}"

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci

echo "==> applying database migrations"
npm run db:migrate

echo "==> build"
npm run build

echo "==> restarting service"
eval "$RESTART_CMD"

echo "==> done"
