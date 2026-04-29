#!/bin/sh
# Seed the database from the image on first start.
# On Railway mount /data as a persistent volume and set DB_PATH=/data/videos.db.
# After the first deploy the volume keeps all auth/watched data safe across redeploys.
set -e

DB_PATH="${DB_PATH:-/data/videos.db}"

if [ ! -f "$DB_PATH" ]; then
  echo "First start: seeding database to $DB_PATH"
  mkdir -p "$(dirname "$DB_PATH")"
  cp /app/seed.db "$DB_PATH"
fi

exec node /app/frontend/server.js
