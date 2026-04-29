#!/bin/bash

# Push local histograph DB to Railway (drops all remote data first)
# Usage: ./push-to-railway.sh

set -e

# ============================================
# Configuration
# ============================================

# Local DB (Docker container)
LOCAL_CONTAINER="histograph-postgres-1"
LOCAL_DB_NAME="histograph"
LOCAL_DB_USER="histograph"
LOCAL_DB_PASSWORD="histograph"

# Remote Railway DB — override via env or edit here
REMOTE_DB_HOST="${RAILWAY_DB_HOST:-switchyard.proxy.rlwy.net}"
REMOTE_DB_PORT="${RAILWAY_DB_PORT:-54931}"
REMOTE_DB_NAME="${RAILWAY_DB_NAME:-railway}"
REMOTE_DB_USER="${RAILWAY_DB_USER:-postgres}"
REMOTE_DB_PASSWORD="${RAILWAY_DB_PASSWORD:-}"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/histograph_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# ============================================
# Validate required config
# ============================================

if [ -z "$REMOTE_DB_PASSWORD" ]; then
    echo "Error: RAILWAY_DB_PASSWORD is not set."
    echo "Run: export RAILWAY_DB_PASSWORD=<your_railway_postgres_password>"  
    exit 1
fi

echo "========================================"
echo "Histograph → Railway Push"
echo "========================================"
echo ""

mkdir -p "$BACKUP_DIR"

# -----------------------------------------------
# Step 1: Dump local DB via Docker container
# -----------------------------------------------
echo "Step 1/3: Dumping local database..."
echo "  Container : $LOCAL_CONTAINER"
echo "  Database  : $LOCAL_DB_NAME"
echo "  Output    : $BACKUP_FILE"

docker exec \
    -e PGPASSWORD="$LOCAL_DB_PASSWORD" \
    "$LOCAL_CONTAINER" \
    pg_dump \
        -h localhost \
        -U "$LOCAL_DB_USER" \
        -d "$LOCAL_DB_NAME" \
        -F p \
        --no-owner \
        --no-privileges \
        --no-comments > "$BACKUP_FILE"

echo "  Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "✓ Local dump created"
echo ""

# -----------------------------------------------
# Step 2: Compress
# -----------------------------------------------
echo "Step 2/3: Compressing..."
gzip -f "$BACKUP_FILE"
echo "  Compressed size: $(du -h "$COMPRESSED_FILE" | cut -f1)"
echo "✓ Compressed"
echo ""

# -----------------------------------------------
# Step 3: Clear remote DB and restore
# -----------------------------------------------
echo "Step 3/3: Resetting remote Railway database and restoring..."
echo "  Host: $REMOTE_DB_HOST:$REMOTE_DB_PORT"
echo "  DB  : $REMOTE_DB_NAME"
echo ""
echo "  [3a] Dropping all tables on remote..."

# Drop tables in dependency order (children before parents)
PGPASSWORD="$REMOTE_DB_PASSWORD" psql \
    -h "$REMOTE_DB_HOST" \
    -p "$REMOTE_DB_PORT" \
    -U "$REMOTE_DB_USER" \
    -d "$REMOTE_DB_NAME" \
    --no-psqlrc \
    -q \
    -c "
DROP TABLE IF EXISTS user_watched    CASCADE;
DROP TABLE IF EXISTS video_persons   CASCADE;
DROP TABLE IF EXISTS video_topics    CASCADE;
DROP TABLE IF EXISTS video_parse     CASCADE;
DROP TABLE IF EXISTS videos          CASCADE;
DROP TABLE IF EXISTS persons         CASCADE;
DROP TABLE IF EXISTS topics          CASCADE;
DROP TABLE IF EXISTS channels        CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
DROP SEQUENCE IF EXISTS channels_id_seq  CASCADE;
DROP SEQUENCE IF EXISTS videos_id_seq    CASCADE;
DROP SEQUENCE IF EXISTS video_parse_id_seq CASCADE;
DROP SEQUENCE IF EXISTS topics_id_seq    CASCADE;
DROP SEQUENCE IF EXISTS persons_id_seq   CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq     CASCADE;
"

echo "  ✓ Remote tables dropped"
echo ""
echo "  [3b] Restoring dump to remote..."

PGPASSWORD="$REMOTE_DB_PASSWORD" gunzip -c "$COMPRESSED_FILE" | \
    PGPASSWORD="$REMOTE_DB_PASSWORD" psql \
        -h "$REMOTE_DB_HOST" \
        -p "$REMOTE_DB_PORT" \
        -U "$REMOTE_DB_USER" \
        -d "$REMOTE_DB_NAME" \
        --no-psqlrc \
        -v ON_ERROR_STOP=1 \
        -q

echo "  ✓ Restore complete"
echo ""
echo "========================================"
echo "Done! Local histograph DB pushed to Railway."
echo "========================================"
echo "Backup kept at: $COMPRESSED_FILE"
echo ""
echo "To clean up backups older than 7 days:"
echo "  find $BACKUP_DIR -name '*.sql.gz' -mtime +7 -delete"
