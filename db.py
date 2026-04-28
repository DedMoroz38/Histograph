import sqlite3
from typing import Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS channels (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    youtube_channel_id TEXT    UNIQUE NOT NULL,
    name               TEXT    NOT NULL,
    handle             TEXT
);

CREATE TABLE IF NOT EXISTS videos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id     TEXT    UNIQUE NOT NULL,
    channel_id   INTEGER NOT NULL REFERENCES channels(id),
    title        TEXT    NOT NULL,
    description  TEXT,
    published_at TEXT    NOT NULL,
    url          TEXT    NOT NULL,
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
INSERT INTO videos (video_id, channel_id, title, description, published_at, url)
VALUES (:video_id, :channel_id, :title, :description, :published_at, :url)
ON CONFLICT(video_id) DO UPDATE SET
    channel_id  = excluded.channel_id,
    title       = excluded.title,
    description = excluded.description,
    fetched_at  = datetime('now');
"""


def init_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.executescript(SCHEMA)
    return conn


def upsert_channel(conn: sqlite3.Connection, youtube_channel_id: str, name: str, handle: Optional[str] = None) -> int:
    conn.execute(
        "INSERT OR IGNORE INTO channels (youtube_channel_id, name, handle) VALUES (?, ?, ?)",
        (youtube_channel_id, name, handle),
    )
    conn.execute(
        "UPDATE channels SET name=?, handle=? WHERE youtube_channel_id=?",
        (name, handle, youtube_channel_id),
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
