import os
import sys

from dotenv import load_dotenv

from . import db, youtube as yt


def main() -> None:
    load_dotenv()

    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        sys.exit("Error: YOUTUBE_API_KEY is not set.")

    raw_handles = os.getenv("CHANNEL_HANDLES", "").strip()
    if not raw_handles:
        sys.exit("Error: CHANNEL_HANDLES is not set.")

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        sys.exit("Error: DATABASE_URL is not set.")

    handles = [h.strip() for h in raw_handles.split(",") if h.strip()]

    client = yt.build_client(api_key)
    conn = db.init_db(database_url)

    total_inserted = total_updated = 0

    for handle in handles:
        print(f"\nProcessing channel: {handle}")
        try:
            youtube_channel_id, channel_name, logo_url = yt.resolve_channel(client, handle)
        except ValueError as e:
            print(f"  Skipping — {e}")
            continue

        print(f"  Resolved: {channel_name!r} ({youtube_channel_id})")

        channel_db_id = db.upsert_channel(conn, youtube_channel_id, channel_name, handle, logo_url)
        uploads_id = yt.get_uploads_playlist_id(client, youtube_channel_id)
        videos = yt.fetch_all_videos(client, uploads_id, channel_db_id)
        print(f"  Fetched {len(videos)} videos")

        inserted, updated = db.upsert_videos(conn, videos)
        print(f"  Saved: {inserted} new, {updated} updated")
        total_inserted += inserted
        total_updated += updated

    conn.close()
    print(f"\nDone. Total: {total_inserted} new, {total_updated} updated")


if __name__ == "__main__":
    main()
