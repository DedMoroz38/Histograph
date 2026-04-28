# Graph Report - .  (2026-04-28)

## Corpus Check
- Corpus is ~2,050 words - fits in a single context window. You may not need a graph.

## Summary
- 26 nodes · 36 edges · 4 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_YouTube API Client|YouTube API Client]]
- [[_COMMUNITY_Video Parsing Pipeline|Video Parsing Pipeline]]
- [[_COMMUNITY_Database & Fetch Layer|Database & Fetch Layer]]
- [[_COMMUNITY_Database Migration|Database Migration]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 8 edges
2. `main()` - 5 edges
3. `fetch_all_videos()` - 4 edges
4. `init_db()` - 3 edges
5. `resolve_channel()` - 3 edges
6. `build_client()` - 3 edges
7. `save_result()` - 3 edges
8. `migrate()` - 3 edges
9. `upsert_channel()` - 2 edges
10. `upsert_videos()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `get_uploads_playlist_id()`  [INFERRED]
  fetch_videos.py → youtube.py
- `main()` --calls--> `init_db()`  [INFERRED]
  parse_videos.py → db.py
- `main()` --calls--> `upsert_channel()`  [INFERRED]
  fetch_videos.py → db.py
- `main()` --calls--> `upsert_videos()`  [INFERRED]
  fetch_videos.py → db.py
- `main()` --calls--> `resolve_channel()`  [INFERRED]
  fetch_videos.py → youtube.py

## Communities

### Community 0 - "YouTube API Client"
Cohesion: 0.29
Nodes (6): fetch_all_videos(), _fetch_video_details(), get_uploads_playlist_id(), Resolve a @handle or raw channel ID to (channel_id, channel_name)., Fetch all videos from an uploads playlist. Returns list of video dicts., resolve_channel()

### Community 1 - "Video Parsing Pipeline"
Cohesion: 0.48
Nodes (6): build_client(), _clamp_year(), main(), parse_one(), Semantic parser: classifies each video against 20th-century scope and extracts s, save_result()

### Community 2 - "Database & Fetch Layer"
Cohesion: 0.47
Nodes (4): init_db(), upsert_channel(), upsert_videos(), main()

### Community 3 - "Database Migration"
Cohesion: 0.6
Nodes (4): _column_exists(), migrate(), One-time migration from the flat schema (videos.channel_name TEXT) to the normal, _table_exists()

## Knowledge Gaps
- **4 isolated node(s):** `Resolve a @handle or raw channel ID to (channel_id, channel_name).`, `Fetch all videos from an uploads playlist. Returns list of video dicts.`, `Semantic parser: classifies each video against 20th-century scope and extracts s`, `One-time migration from the flat schema (videos.channel_name TEXT) to the normal`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `main()` connect `Database & Fetch Layer` to `YouTube API Client`, `Video Parsing Pipeline`?**
  _High betweenness centrality (0.420) - this node is a cross-community bridge._
- **Why does `build_client()` connect `Video Parsing Pipeline` to `Database & Fetch Layer`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **Why does `fetch_all_videos()` connect `YouTube API Client` to `Database & Fetch Layer`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `main()` (e.g. with `build_client()` and `init_db()`) actually correct?**
  _`main()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `init_db()` (e.g. with `main()` and `main()`) actually correct?**
  _`init_db()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Resolve a @handle or raw channel ID to (channel_id, channel_name).`, `Fetch all videos from an uploads playlist. Returns list of video dicts.`, `Semantic parser: classifies each video against 20th-century scope and extracts s` to the rest of the system?**
  _4 weakly-connected nodes found - possible documentation gaps or missing edges._