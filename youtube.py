from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

YOUTUBE_URL = "https://www.youtube.com/watch?v="


def build_client(api_key: str):
    return build("youtube", "v3", developerKey=api_key)


def resolve_channel(youtube, handle: str) -> tuple[str, str]:
    """Resolve a @handle or raw channel ID to (channel_id, channel_name)."""
    handle = handle.strip()

    if handle.startswith("@"):
        resp = youtube.channels().list(
            part="id,snippet",
            forHandle=handle.lstrip("@"),
        ).execute()
    else:
        # treat as a raw channel ID
        resp = youtube.channels().list(
            part="id,snippet",
            id=handle,
        ).execute()

    items = resp.get("items", [])
    if not items:
        raise ValueError(f"Channel not found: {handle!r}")

    item = items[0]
    return item["id"], item["snippet"]["title"]


def get_uploads_playlist_id(youtube, channel_id: str) -> str:
    resp = youtube.channels().list(
        part="contentDetails",
        id=channel_id,
    ).execute()
    return resp["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]


def fetch_all_videos(youtube, uploads_playlist_id: str, channel_db_id: int) -> list[dict]:
    """Fetch all videos from an uploads playlist. Returns list of video dicts."""
    video_ids = []
    next_page = None

    while True:
        kwargs = dict(
            part="snippet",
            playlistId=uploads_playlist_id,
            maxResults=50,
        )
        if next_page:
            kwargs["pageToken"] = next_page

        resp = youtube.playlistItems().list(**kwargs).execute()
        for item in resp.get("items", []):
            vid = item["snippet"].get("resourceId", {}).get("videoId")
            if vid:
                video_ids.append(vid)

        next_page = resp.get("nextPageToken")
        if not next_page:
            break

    return _fetch_video_details(youtube, video_ids, channel_db_id)


def _fetch_video_details(youtube, video_ids: list[str], channel_db_id: int) -> list[dict]:
    results = []
    # batch in chunks of 50 (API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = youtube.videos().list(
            part="snippet",
            id=",".join(batch),
        ).execute()

        for item in resp.get("items", []):
            snippet = item["snippet"]
            vid = item["id"]
            results.append({
                "video_id": vid,
                "channel_id": channel_db_id,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "published_at": snippet.get("publishedAt", ""),
                "url": YOUTUBE_URL + vid,
            })

    return results
