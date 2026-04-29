#!/bin/sh
set -e

# Apply schema idempotently (CREATE TABLE IF NOT EXISTS — safe on every boot)
if [ -n "$DATABASE_URL" ]; then
  node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(fs.readFileSync('/app/schema.sql', 'utf8'))
  .then(() => { console.log('Schema applied.'); pool.end(); })
  .catch(e => { console.error('Schema error:', e.message); pool.end(); process.exit(1); });
"
fi

exec node /app/frontend/server.js
