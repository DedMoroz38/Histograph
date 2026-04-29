"""
One-time migration from the flat schema (videos.channel_name TEXT) to
the normalized schema (channels table + videos.channel_id FK).

Safe to re-run: it checks whether migration is needed first.
Creates videos_backup.db before touching anything.
"""

import shutil
import sqlite3
import sys

DB_PATH = "videos.db"
BACKUP_PATH = "videos_backup.db"


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cols = [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]
    return column in cols


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    return conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone() is not None


def migrate() -> None:
    conn = sqlite3.connect(DB_PATH)

    if not _table_exists(conn, "videos"):
        print("No videos table found — nothing to migrate.")
        conn.close()
        return

    if not _column_exists(conn, "videos", "channel_name"):
        print("Schema already normalized — nothing to migrate.")
        conn.close()
        return

    conn.close()

    # Back up before touching anything
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backed up to {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = OFF")

    try:
        # 1. Create channels table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS channels (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                youtube_channel_id TEXT    UNIQUE NOT NULL,
                name               TEXT    NOT NULL,
                handle             TEXT
            )
        """)

        # 2. Populate channels from distinct channel_names; use name as placeholder ID
        conn.execute("""
            INSERT OR IGNORE INTO channels (youtube_channel_id, name)
            SELECT DISTINCT channel_name, channel_name FROM videos
        """)

        # 3. Recreate videos with channel_id FK
        conn.execute("""
            CREATE TABLE videos_new (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id     TEXT    UNIQUE NOT NULL,
                channel_id   INTEGER NOT NULL REFERENCES channels(id),
                title        TEXT    NOT NULL,
                description  TEXT,
                published_at TEXT    NOT NULL,
                url          TEXT    NOT NULL,
                fetched_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)

        conn.execute("""
            INSERT INTO videos_new (video_id, channel_id, title, description, published_at, url, fetched_at)
            SELECT v.video_id, c.id, v.title, v.description, v.published_at, v.url, v.fetched_at
            FROM videos v
            JOIN channels c ON c.name = v.channel_name
        """)

        conn.execute("DROP TABLE videos")
        conn.execute("ALTER TABLE videos_new RENAME TO videos")

        # 4. Create new semantic tables
        conn.execute("""
            CREATE TABLE IF NOT EXISTS video_parse (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id     TEXT    UNIQUE NOT NULL REFERENCES videos(video_id),
                main_topic   TEXT,
                event_name   TEXT,
                start_year   INTEGER,
                end_year     INTEGER,
                primary_year INTEGER,
                confidence   REAL,
                parse_status TEXT    NOT NULL DEFAULT 'pending',
                parsed_at    TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS topics (
                id   INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT    UNIQUE NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS video_topics (
                video_id TEXT    NOT NULL REFERENCES videos(video_id),
                topic_id INTEGER NOT NULL REFERENCES topics(id),
                PRIMARY KEY (video_id, topic_id)
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS persons (
                id   INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT    UNIQUE NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS video_persons (
                video_id  TEXT    NOT NULL REFERENCES videos(video_id),
                person_id INTEGER NOT NULL REFERENCES persons(id),
                PRIMARY KEY (video_id, person_id)
            )
        """)

        conn.commit()
        conn.execute("PRAGMA foreign_keys = ON")

        video_count = conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]
        channel_count = conn.execute("SELECT COUNT(*) FROM channels").fetchone()[0]
        print(f"Migration complete: {video_count} videos across {channel_count} channels")

    except Exception as exc:
        conn.rollback()
        print(f"Migration failed: {exc}")
        print(f"Original database is untouched — restore from {BACKUP_PATH} if needed")
        sys.exit(1)
    finally:
        conn.close()


def add_users_table() -> None:
    """Add users table for auth. Safe to re-run."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT    UNIQUE NOT NULL,
                password_hash TEXT    NOT NULL,
                created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.commit()
        print("users table ready")
    finally:
        conn.close()


def add_oauth_columns() -> None:
    """Extend users table with OAuth columns and relax NOT NULL constraints. Safe to re-run."""
    conn = sqlite3.connect(DB_PATH)
    try:
        if _column_exists(conn, "users", "google_id"):
            print("OAuth columns already present — skipping.")
            conn.close()
            return

        conn.execute("PRAGMA foreign_keys = OFF")
        conn.execute("""
            CREATE TABLE users_new (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                email          TEXT    UNIQUE,
                password_hash  TEXT,
                name           TEXT,
                image          TEXT,
                google_id      TEXT    UNIQUE,
                telegram_id    TEXT    UNIQUE,
                last_logged_in TEXT,
                created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            INSERT INTO users_new (id, email, password_hash, created_at)
            SELECT id, email, password_hash, created_at FROM users
        """)
        conn.execute("DROP TABLE users")
        conn.execute("ALTER TABLE users_new RENAME TO users")
        conn.execute("PRAGMA foreign_keys = ON")
        conn.commit()
        print("OAuth columns added to users table")
    except Exception as exc:
        conn.rollback()
        print(f"add_oauth_columns failed: {exc}")
        sys.exit(1)
    finally:
        conn.close()


def add_watched_table() -> None:
    """Add user_watched table for persisting watched videos. Safe to re-run."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_watched (
                user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                video_id   TEXT    NOT NULL,
                watched_at TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, video_id)
            )
        """)
        conn.commit()
        print("user_watched table ready")
    finally:
        conn.close()


def add_last_logged_in() -> None:
    """Add last_logged_in column to users table. Safe to re-run."""
    conn = sqlite3.connect(DB_PATH)
    try:
        if _column_exists(conn, "users", "last_logged_in"):
            print("last_logged_in column already present — skipping.")
            return
        conn.execute("ALTER TABLE users ADD COLUMN last_logged_in TEXT")
        conn.commit()
        print("last_logged_in column added to users table")
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
    add_users_table()
    add_oauth_columns()
    add_last_logged_in()
    add_watched_table()
