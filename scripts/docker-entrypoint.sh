#!/bin/sh
set -e

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "[entrypoint] PORT=${PORT} — waiting for database and applying migrations…"

if [ "${SKIP_DB_MIGRATE}" != "true" ] && [ -f "./scripts/migrate.mjs" ]; then
  node ./scripts/migrate.mjs
else
  echo "[entrypoint] skipping migrations"
fi

if [ "${SKIP_DB_SEED}" != "true" ] && [ -f "./scripts/seed.mjs" ]; then
  echo "[entrypoint] applying deployment seed data..."
  node ./scripts/seed.mjs
else
  echo "[entrypoint] skipping seed"
fi

echo "[entrypoint] Starting Next.js server on port ${PORT}…"
exec node server.js
