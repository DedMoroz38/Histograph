#!/bin/sh
set -e

# Apply schema idempotently (CREATE TABLE IF NOT EXISTS — safe on every boot)
if [ -n "$DATABASE_URL" ]; then
  node -e "
const { Pool } = require('pg');
const fs = require('fs');
const schema = fs.readFileSync('/app/schema.sql', 'utf8');

function tryApply(ssl, attemptsLeft) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl });
  pool.query(schema)
    .then(() => { console.log('Schema applied.'); pool.end(); })
    .catch(e => {
      pool.end();
      const msg = e.message || e.code || String(e);
      // Server doesn't support SSL — retry without it
      if (ssl && msg.includes('does not support SSL')) {
        console.log('SSL not supported by server, retrying without SSL...');
        return tryApply(false, attemptsLeft);
      }
      console.error('Schema error:', msg);
      if (attemptsLeft > 1) {
        console.log('Retrying in 3s (' + (attemptsLeft - 1) + ' attempts left)...');
        setTimeout(() => tryApply(ssl, attemptsLeft - 1), 3000);
      } else {
        process.exit(1);
      }
    });
}

// Start with SSL (required by Railway and most cloud providers)
tryApply({ rejectUnauthorized: false }, 5);
"
fi

exec node /app/frontend/server.js
