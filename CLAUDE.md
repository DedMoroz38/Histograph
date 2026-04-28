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
- `ANTHROPIC_API_KEY` — for `parse-videos`

## Running the pipeline

```bash
fetch-videos     # Fetch all video metadata → videos.db
parse-videos     # Classify fetched videos with Claude
migrate-db       # One-time schema migration (flat → normalized); safe to re-run
```

Each script can also be run directly (`python fetch_videos.py`, etc.).

## Architecture

All five modules are flat at the repo root with no subdirectory packages.

| File | Role |
|------|------|
| `youtube.py` | YouTube Data API v3 wrapper — resolve channel handles, paginate playlist items, batch-fetch video details |
| `fetch_videos.py` | Entry point: reads env, iterates channels, calls `youtube.py` then `db.py` |
| `db.py` | SQLite schema definition + `upsert_channel` / `upsert_videos` helpers; WAL mode + FK enforcement |
| `parse_videos.py` | Entry point: queries `pending` videos, calls Claude, writes to `video_parse` / `topics` / `persons` |
| `migrate.py` | One-time migration from old flat schema (`videos.channel_name TEXT`) to normalized `channels` table |

### Data flow

```
.env
 └─ CHANNEL_HANDLES / YOUTUBE_API_KEY
       │
       ▼
 fetch_videos.py
   ├── youtube.py  →  resolve handle → uploads playlist → video IDs → video details
   └── db.py       →  upsert channels + videos  →  videos.db
                                                       │
                                                       ▼
                                               parse_videos.py
                                                 ├── db.py    (read pending videos)
                                                 ├── Claude API (classify + extract)
                                                 └── db.py    (write video_parse, topics, persons)
```

### Database schema (videos.db)

- `channels` — YouTube channel registry (youtube_channel_id, name, handle)
- `videos` — raw metadata (title, description, published_at, url, fetched_at)
- `video_parse` — Claude output per video (parse_status: `pending` | `done` | `skipped` | `failed`)
- `topics` / `video_topics` — normalized topic keywords extracted by Claude
- `persons` / `video_persons` — normalized historical figures extracted by Claude

### Claude integration details (`parse_videos.py`)

- Uses `claude-opus-4-7` with `output_config.effort = "low"` and strict JSON schema output (`json_schema` format).
- System prompt is marked `cache_control: ephemeral` so it is prompt-cached across the batch — only pay for it once per session.
- `parse_status = 'failed'` is safe to retry; re-running `parse-videos` picks up any `pending` or failed rows.
- Years are clamped to 1900–1999 by `_clamp_year()` before writing to the DB.