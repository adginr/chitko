#!/usr/bin/env bash
# Pull, install, migrate, build, and restart chitko on the server.
# First-time setup: see DEPLOY.md. Requires a working systemd unit
# named "chitko" (see deploy/chitko.service) unless DEPLOY_RESTART_CMD
# is overridden below.
set -euo pipefail

cd "$(dirname "$0")/.."

RESTART_CMD="${DEPLOY_RESTART_CMD:-sudo systemctl restart chitko}"

echo "==> git pull"
git pull --ff-only

echo "==> pnpm install"
pnpm install --frozen-lockfile

echo "==> applying database migrations"
pnpm db:migrate

echo "==> build"
pnpm build

echo "==> restarting service"
eval "$RESTART_CMD"

echo "==> done"
