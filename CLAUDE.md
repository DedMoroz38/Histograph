# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

## What this project does

Histograph is a two-stage pipeline for a 20th-century Russian history platform:

1. **Fetch** — pulls all video metadata from YouTube channels via the YouTube Data API and stores it in SQLite.
2. **Parse** — runs each unfiled video title/description through Claude (claude-opus-4-7) to classify whether it's 20th-century historical content and extract structured metadata (years, topics, persons).

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
```

Required `.env` variables:
- `YOUTUBE_API_KEY` — YouTube Data API v3 key
- `CHANNEL_HANDLES` — comma-separated `@handle` or raw channel IDs
- `OPENAI_API_KEY` — for `parse-videos`
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://histograph:histograph@localhost:5432/histograph`)

## Running the pipeline

```bash
fetch-videos     # Fetch all video metadata → PostgreSQL
parse-videos     # Classify fetched videos with OpenAI
```

Each script can also be run directly (`python -m parser.fetch_videos`, etc.).

Both scripts read `DATABASE_URL` from `.env` (or environment). Run `docker compose up postgres -d` first for a local DB.

## Architecture

All five modules are flat at the repo root with no subdirectory packages.

| File | Role |
|------|------|
| `youtube.py` | YouTube Data API v3 wrapper — resolve channel handles, paginate playlist items, batch-fetch video details |
| `fetch_videos.py` | Entry point: reads env, iterates channels, calls `youtube.py` then `db.py` |
| `db.py` | PostgreSQL schema + `init_db` / `upsert_channel` / `upsert_videos` helpers (psycopg2) |
| `parse_videos.py` | Entry point: queries `pending` videos, calls OpenAI, writes to `video_parse` / `topics` / `persons` |

### Data flow

```
.env
 └─ CHANNEL_HANDLES / YOUTUBE_API_KEY
       │
       ▼
 fetch_videos.py
   ├── youtube.py  →  resolve handle → uploads playlist → video IDs → video details
   └── db.py       →  upsert channels + videos  →  PostgreSQL
                                                       │
                                                       ▼
                                               parse_videos.py
                                                 ├── db.py       (read pending videos)
                                                 ├── OpenAI API  (classify + extract)
                                                 └── db.py       (write video_parse, topics, persons)
```

### Database schema (PostgreSQL — see `schema.sql`)

- `channels` — YouTube channel registry (youtube_channel_id, name, handle)
- `videos` — raw metadata (title, description, published_at, url, fetched_at)
- `video_parse` — Claude output per video (parse_status: `pending` | `done` | `skipped` | `failed`)
- `topics` / `video_topics` — normalized topic keywords extracted by Claude
- `persons` / `video_persons` — normalized historical figures extracted by Claude

### Parser integration details (`parse_videos.py`)

- Uses OpenAI `gpt-4o-mini` with strict JSON schema output (`json_schema` format).
- `parse_status = 'failed'` is safe to retry; re-running `parse-videos` picks up any `pending` or failed rows.
- Years are clamped to 1900–1999 by `_clamp_year()` before writing to the DB.

### Local Docker setup

```bash
docker compose up postgres -d   # start DB (schema applied automatically on first boot)
fetch-videos                     # populate videos table
parse-videos                     # classify + extract metadata
docker compose up frontend -d   # start Next.js frontend
```