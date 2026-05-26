#!/bin/sh
set -e

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "[entrypoint] Sovereign Namibia — deploy bootstrap (PORT=${PORT})"

if [ -z "${DATABASE_URL}" ]; then
  echo "[entrypoint] WARNING: DATABASE_URL is not set — skipping migrate/seed"
else
  if [ "${SKIP_DB_MIGRATE}" != "true" ] && [ -f "./scripts/migrate.mjs" ]; then
    echo "[entrypoint] Running database migrations…"
    node ./scripts/migrate.mjs
  else
    echo "[entrypoint] Skipping migrations (SKIP_DB_MIGRATE=${SKIP_DB_MIGRATE:-false})"
  fi

  if [ "${SKIP_DB_SEED}" != "true" ] && [ -f "./scripts/seed.mjs" ]; then
    echo "[entrypoint] Running deployment seed (admin + registry demo data)…"
    node ./scripts/seed.mjs
    echo "[entrypoint] Seed complete."
  else
    echo "[entrypoint] Skipping seed (SKIP_DB_SEED=${SKIP_DB_SEED:-false})"
  fi
fi

echo "[entrypoint] Starting Next.js server on port ${PORT}…"
exec node server.js
