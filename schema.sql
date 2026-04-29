-- PostgreSQL schema — idempotent (safe to run multiple times)

CREATE TABLE IF NOT EXISTS channels (
    id                 SERIAL      PRIMARY KEY,
    youtube_channel_id TEXT        UNIQUE NOT NULL,
    name               TEXT        NOT NULL,
    handle             TEXT,
    logo_url           TEXT
);

CREATE TABLE IF NOT EXISTS videos (
    id            SERIAL      PRIMARY KEY,
    video_id      TEXT        UNIQUE NOT NULL,
    channel_id    INTEGER     NOT NULL REFERENCES channels(id),
    title         TEXT        NOT NULL,
    description   TEXT,
    published_at  TEXT        NOT NULL,
    url           TEXT        NOT NULL,
    thumbnail_url TEXT,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_parse (
    id           SERIAL      PRIMARY KEY,
    video_id     TEXT        UNIQUE NOT NULL REFERENCES videos(video_id),
    main_topic   TEXT,
    event_name   TEXT,
    start_year   INTEGER,
    end_year     INTEGER,
    primary_year INTEGER,
    confidence   REAL,
    parse_status TEXT        NOT NULL DEFAULT 'pending',
    parsed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS topics (
    id   SERIAL PRIMARY KEY,
    name TEXT   UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS video_topics (
    video_id TEXT    NOT NULL REFERENCES videos(video_id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    PRIMARY KEY (video_id, topic_id)
);

CREATE TABLE IF NOT EXISTS persons (
    id   SERIAL PRIMARY KEY,
    name TEXT   UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS video_persons (
    video_id  TEXT    NOT NULL REFERENCES videos(video_id),
    person_id INTEGER NOT NULL REFERENCES persons(id),
    PRIMARY KEY (video_id, person_id)
);

CREATE TABLE IF NOT EXISTS users (
    id             SERIAL      PRIMARY KEY,
    email          TEXT        UNIQUE,
    password_hash  TEXT,
    name           TEXT,
    image          TEXT,
    google_id      TEXT        UNIQUE,
    telegram_id    TEXT        UNIQUE,
    last_logged_in TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_watched (
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id   TEXT        NOT NULL,
    watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, video_id)
);
