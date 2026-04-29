# Graph Report - histograph  (2026-04-29)

## Corpus Check
- 37 files · ~242,270 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 106 nodes · 110 edges · 15 communities detected
- Extraction: 71% EXTRACTED · 29% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 13 edges
2. `main()` - 8 edges
3. `signUp()` - 6 edges
4. `main()` - 6 edges
5. `signIn()` - 5 edges
6. `getUserByEmail()` - 5 edges
7. `resolve_channel()` - 5 edges
8. `fetch_all_videos()` - 5 edges
9. `handleAuth()` - 4 edges
10. `createSession()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `save_result()` --calls--> `GET()`  [INFERRED]
  parser/parse_videos.py → frontend/src/app/api/videos/route.ts
- `main()` --calls--> `GET()`  [INFERRED]
  parser/parse_videos.py → frontend/src/app/api/videos/route.ts
- `_best_thumbnail()` --calls--> `GET()`  [INFERRED]
  parser/youtube.py → frontend/src/app/api/videos/route.ts
- `resolve_channel()` --calls--> `GET()`  [INFERRED]
  parser/youtube.py → frontend/src/app/api/videos/route.ts
- `fetch_all_videos()` --calls--> `GET()`  [INFERRED]
  parser/youtube.py → frontend/src/app/api/videos/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.26
Nodes (9): signIn(), signOut(), signUp(), createUser(), getAuthDb(), getUserByEmail(), deleteSession(), handleAuth() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.29
Nodes (7): _best_thumbnail(), fetch_all_videos(), _fetch_video_details(), Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url)., Fetch all videos from an uploads playlist. Returns list of video dicts., resolve_channel(), GET()

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (7): Parser package for histograph — video fetching and semantic analysis., build_client(), _clamp_year(), main(), parse_one(), Semantic parser: classifies each video against 20th-century scope and extracts s, save_result()

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (4): fetchVideos(), Home(), getDb(), GET()

### Community 4 - "Community 4"
Cohesion: 0.36
Nodes (7): _ensure_columns(), init_db(), Add new columns to existing tables if they are missing (idempotent)., upsert_channel(), upsert_videos(), main(), get_uploads_playlist_id()

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (6): add_users_table(), _column_exists(), migrate(), One-time migration from the flat schema (videos.channel_name TEXT) to the normal, Add users table for auth. Safe to re-run., _table_exists()

### Community 6 - "Community 6"
Cohesion: 0.6
Nodes (4): createSession(), decrypt(), encrypt(), getSession()

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Add new columns to existing tables if they are missing (idempotent).

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url).

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Fetch all videos from an uploads playlist. Returns list of video dicts.

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Semantic parser: classifies each video against 20th-century scope and extracts s

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): One-time migration from the flat schema (videos.channel_name TEXT) to the normal

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Add users table for auth. Safe to re-run.

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Resolve a @handle or raw channel ID to (channel_id, channel_name).

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Fetch all videos from an uploads playlist. Returns list of video dicts.

## Knowledge Gaps
- **15 isolated node(s):** `Add new columns to existing tables if they are missing (idempotent).`, `Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url).`, `Fetch all videos from an uploads playlist. Returns list of video dicts.`, `Semantic parser: classifies each video against 20th-century scope and extracts s`, `Parser package for histograph — video fetching and semantic analysis.` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 30`** (1 nodes): `Add new columns to existing tables if they are missing (idempotent).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Resolve a @handle or raw channel ID to (channel_id, channel_name, logo_url).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Fetch all videos from an uploads playlist. Returns list of video dicts.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `Semantic parser: classifies each video against 20th-century scope and extracts s`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `One-time migration from the flat schema (videos.channel_name TEXT) to the normal`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `Add users table for auth. Safe to re-run.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Resolve a @handle or raw channel ID to (channel_id, channel_name).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `Fetch all videos from an uploads playlist. Returns list of video dicts.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `main()` connect `Community 2` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `getDb()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `GET()` (e.g. with `signUp()` and `signIn()`) actually correct?**
  _`GET()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `main()` (e.g. with `build_client()` and `init_db()`) actually correct?**
  _`main()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `signUp()` (e.g. with `GET()` and `getUserByEmail()`) actually correct?**
  _`signUp()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `main()` (e.g. with `init_db()` and `GET()`) actually correct?**
  _`main()` has 2 INFERRED edges - model-reasoned connections that need verification._