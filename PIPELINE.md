# Histograph — Pipeline Overview

Histograph is a two-stage data pipeline for a 20th-century Russian history platform.
It pulls raw video metadata from YouTube, then uses Claude to classify and extract structured historical metadata from each video.

---

## Stage 1 — Fetch (`fetch-videos`)

**Entry point:** `fetch_videos.py`  
**Run:** `fetch-videos` (or `python fetch_videos.py`)

### What it does

1. Reads `CHANNEL_HANDLES` from `.env` (comma-separated `@handle` or raw channel IDs).
2. For each handle, calls the YouTube Data API v3 to:
   - Resolve the handle → `(channel_id, channel_name)` via `channels.list`
   - Get the channel's uploads playlist ID via `contentDetails`
   - Paginate through `playlistItems.list` (50 items/page) to collect all video IDs
   - Batch-fetch full video details via `videos.list` (50 IDs/request)
3. Upserts channels and videos into `videos.db`.

### Key behaviour

- **Idempotent** — re-running updates existing rows and adds new ones; nothing is deleted.
- **Private/deleted videos** are silently dropped: they appear in the playlist but `videos.list` returns no details for them.
- **No hard limit** — the playlist pagination loop runs until `nextPageToken` is absent, so channels with thousands of videos are handled correctly.

### Output tables

| Table | Written by | Content |
|-------|-----------|---------|
| `channels` | `upsert_channel()` | One row per YouTube channel |
| `videos` | `upsert_videos()` | One row per video (title, description, URL, published_at) |

---

## Stage 2 — Semantic Parse (`parse-videos`)

**Entry point:** `parse_videos.py`  
**Run:** `parse-videos` (or `python parse_videos.py`)

### What it does

For every video whose `parse_status` is `pending` (or has no entry yet), sends the title and up to 600 characters of description to Claude and writes the structured result back to the DB.

### Classification logic

Claude first decides whether the video is **in scope** for the platform:

**In scope (`in_scope = true`)** — video is primarily about people, events, or processes from **1900–1999**, even if published recently (e.g. a documentary about WWII, a Stalin biography).

**Out of scope (`in_scope = false`)** — video is clearly about:
- Events before 1900 (ancient, medieval, 19th-century history)
- Events after 1999 (current affairs, 21st-century topics)
- Entertainment, sports, lifestyle, cooking, travel — with no 20th-century historical angle
- General business, tech, or personal-development content

### Extracted fields (when in scope)

| Field | Type | Description |
|-------|------|-------------|
| `main_topic` | string | Broad category in Russian (e.g. "История России") |
| `event_name` | string | Specific named event in Russian (e.g. "Вторая мировая война") |
| `start_year` | integer | First year of the event/period (clamped to 1900–1999) |
| `end_year` | integer | Last year of the event/period (clamped to 1900–1999) |
| `primary_year` | integer | Single most representative year (clamped to 1900–1999) |
| `confidence` | float | 0.0–1.0 certainty this is genuinely 20th-century content |
| `topics` | string[] | 2–5 specific keywords in Russian |
| `persons` | string[] | Historical figures mentioned (full names where possible) |

Years outside 1900–1999 are set to `NULL` by `_clamp_year()` rather than stored as invalid values.

### Claude API details

| Setting | Value |
|---------|-------|
| Model | `claude-opus-4-7` |
| Max tokens | 512 |
| Effort | `low` (faster, cheaper for classification tasks) |
| Output format | `json_schema` (strict, no extra fields) |
| Prompt caching | System prompt marked `cache_control: ephemeral` — paid once per session |

### `parse_status` lifecycle

```
(no row) ──► pending ──► done     ← in scope, metadata extracted
                     └─► skipped  ← out of scope, no further work needed
                     └─► failed   ← API/JSON error, safe to retry
```

Re-running `parse-videos` automatically picks up any `pending` or `failed` rows. `skipped` and `done` rows are not re-processed.

### Output tables

| Table | Written by | Content |
|-------|-----------|---------|
| `video_parse` | `save_result()` | One row per video: status + all extracted fields |
| `topics` | `save_result()` | Deduplicated keyword lookup table |
| `video_topics` | `save_result()` | Many-to-many: video ↔ topic |
| `persons` | `save_result()` | Deduplicated person name lookup table |
| `video_persons` | `save_result()` | Many-to-many: video ↔ person |

---

## Full Data Flow

```
.env  (YOUTUBE_API_KEY, CHANNEL_HANDLES, ANTHROPIC_API_KEY)
  │
  ▼
fetch_videos.py
  ├── youtube.py   resolve handle → uploads playlist → video IDs → video details
  └── db.py        upsert channels + videos  →  videos.db
                                                    │
                              ┌─────────────────────┘
                              ▼
                      parse_videos.py
                        ├── db.py     SELECT pending videos
                        ├── Claude    classify + extract (with prompt cache)
                        └── db.py    write video_parse, topics, persons
```

---

## Running the pipeline

```bash
# One-time setup
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env   # fill in YOUTUBE_API_KEY, CHANNEL_HANDLES, ANTHROPIC_API_KEY

# Run
fetch-videos    # pull all video metadata from YouTube
parse-videos    # classify and extract metadata with Claude
```

`fetch-videos` should be re-run periodically to pick up newly uploaded videos.  
`parse-videos` only processes unprocessed rows, so it's safe to run at any time.
