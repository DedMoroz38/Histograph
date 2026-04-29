import sqlite3
from typing import Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS channels (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_channel_id TEXT    UNIQUE NOT NULL,
    name               TEXT    NOT NULL,
    handle             TEXT,
    logo_url           TEXT
);

CREATE TABLE IF NOT EXISTS videos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id     TEXT    UNIQUE NOT NULL,
    channel_id   INTEGER NOT NULL REFERENCES channels(id),
    title        TEXT    NOT NULL,
    description  TEXT,
    published_at TEXT    NOT NULL,
    url          TEXT    NOT NULL,
    thumbnail_url TEXT,
    fetched_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

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
);

CREATE TABLE IF NOT EXISTS topics (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS video_topics (
    video_id TEXT    NOT NULL REFERENCES videos(video_id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    PRIMARY KEY (video_id, topic_id)
);

CREATE TABLE IF NOT EXISTS persons (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS video_persons (
    video_id  TEXT    NOT NULL REFERENCES videos(video_id),
    person_id INTEGER NOT NULL REFERENCES persons(id),
    PRIMARY KEY (video_id, person_id)
);
"""

UPSERT_VIDEO = """
INSERT INTO videos (video_id, channel_id, title, description, published_at, url, thumbnail_url)
VALUES (:video_id, :channel_id, :title, :description, :published_at, :url, :thumbnail_url)
ON CONFLICT(video_id) DO UPDATE SET
    channel_id    = excluded.channel_id,
    title         = excluded.title,
    description   = excluded.description,
    thumbnail_url = excluded.thumbnail_url,
    fetched_at    = datetime('now');
"""


def init_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.executescript(SCHEMA)
    _ensure_columns(conn)
    return conn


def _ensure_columns(conn: sqlite3.Connection) -> None:
    """Add new columns to existing tables if they are missing (idempotent)."""
    existing = {
        row[1]
        for row in conn.execute("PRAGMA table_info(channels)")
    }
    if "logo_url" not in existing:
        conn.execute("ALTER TABLE channels ADD COLUMN logo_url TEXT")

    existing = {
        row[1]
        for row in conn.execute("PRAGMA table_info(videos)")
    }
    if "thumbnail_url" not in existing:
        conn.execute("ALTER TABLE videos ADD COLUMN thumbnail_url TEXT")

    conn.commit()


def upsert_channel(conn: sqlite3.Connection, youtube_channel_id: str, name: str, handle: Optional[str] = None, logo_url: Optional[str] = None) -> int:
    conn.execute(
        "INSERT OR IGNORE INTO channels (youtube_channel_id, name, handle, logo_url) VALUES (?, ?, ?, ?)",
        (youtube_channel_id, name, handle, logo_url),
    )
    # Update name/handle each run, but only set logo_url if not already stored.
    conn.execute(
        "UPDATE channels SET name=?, handle=?, logo_url=COALESCE(logo_url, ?) WHERE youtube_channel_id=?",
        (name, handle, logo_url, youtube_channel_id),
    )
    conn.commit()
    return conn.execute(
        "SELECT id FROM channels WHERE youtube_channel_id=?", (youtube_channel_id,)
    ).fetchone()[0]


def upsert_videos(conn: sqlite3.Connection, rows: list[dict]) -> tuple[int, int]:
    before = conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]
    conn.executemany(UPSERT_VIDEO, rows)
    conn.commit()
    after = conn.execute("SELECT COUNT(*) FROM videos").fetchone()[0]
    inserted = after - before
    updated = len(rows) - inserted
    return inserted, updated
