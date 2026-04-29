# Graph Report - histograph  (2026-04-29)

## Corpus Check
- 36 files · ~242,257 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 98 nodes · 107 edges · 8 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 13 edges
2. `main()` - 8 edges
3. `main()` - 6 edges
4. `signUp()` - 6 edges
5. `resolve_channel()` - 5 edges
6. `fetch_all_videos()` - 5 edges
7. `signIn()` - 5 edges
8. `getUserByEmail()` - 5 edges
9. `init_db()` - 4 edges
10. `_best_thumbnail()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `init_db()` --calls--> `main()`  [INFERRED]
  db.py → parse_videos.py
- `upsert_channel()` --calls--> `main()`  [INFERRED]
  db.py → fetch_videos.py
- `upsert_videos()` --calls--> `main()`  [INFERRED]
  db.py → fetch_videos.py
- `resolve_channel()` --calls--> `main()`  [INFERRED]
  youtube.py → fetch_videos.py
- `get_uploads_playlist_id()` --calls--> `main()`  [INFERRED]
  youtube.py → fetch_videos.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (13): signIn(), signOut(), signUp(), createUser(), getAuthDb(), getUserByEmail(), createSession(), decrypt() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (7): _best_thumbnail(), fetch_all_videos(), _fetch_video_details(), Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url)., Fetch all videos from an uploads playlist. Returns list of video dicts., resolve_channel(), GET()

### Community 2 - "Community 2"
Cohesion: 0.31
Nodes (7): _ensure_columns(), init_db(), Add new columns to existing tables if they are missing (idempotent)., upsert_channel(), upsert_videos(), main(), get_uploads_playlist_id()

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (4): fetchVideos(), Home(), getDb(), GET()

### Community 4 - "Community 4"
Cohesion: 0.48
Nodes (6): build_client(), _clamp_year(), main(), parse_one(), Semantic parser: classifies each video against 20th-century scope and extracts s, save_result()

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (6): add_users_table(), _column_exists(), migrate(), One-time migration from the flat schema (videos.channel_name TEXT) to the normal, Add users table for auth. Safe to re-run., _table_exists()

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Resolve a @handle or raw channel ID to (channel_id, channel_name).

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Fetch all videos from an uploads playlist. Returns list of video dicts.

## Knowledge Gaps
- **8 isolated node(s):** `Add new columns to existing tables if they are missing (idempotent).`, `Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url).`, `Fetch all videos from an uploads playlist. Returns list of video dicts.`, `Semantic parser: classifies each video against 20th-century scope and extracts s`, `One-time migration from the flat schema (videos.channel_name TEXT) to the normal` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 29`** (1 nodes): `Resolve a @handle or raw channel ID to (channel_id, channel_name).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Fetch all videos from an uploads playlist. Returns list of video dicts.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.198) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 4` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `GET()` (e.g. with `_best_thumbnail()` and `resolve_channel()`) actually correct?**
  _`GET()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `main()` (e.g. with `build_client()` and `init_db()`) actually correct?**
  _`main()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `main()` (e.g. with `init_db()` and `GET()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `signUp()` (e.g. with `GET()` and `getUserByEmail()`) actually correct?**
  _`signUp()` has 5 INFERRED edges - model-reasoned connections that need verification._