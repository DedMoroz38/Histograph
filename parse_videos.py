"""
Semantic parser: classifies each video against 20th-century scope and extracts
structured metadata. Uses gpt-4o-mini with structured JSON output.

parse_status values:
  pending  – not yet processed
  done     – in scope, full metadata extracted
  skipped  – clearly out of 20th-century scope, no further work needed
  failed   – API/parse error, safe to retry
"""

import json
import os
import sys

import openai
from dotenv import load_dotenv

import db

DB_PATH = "videos.db"
MODEL = "gpt-4o-mini"
DESC_LIMIT = 600  # characters of description sent to the model

SYSTEM_PROMPT = """\
You classify Russian-language YouTube video titles and descriptions for a 20th-century history platform.

SCOPE: 20th century only — events whose primary timeframe falls within 1900–1999.

Mark in_scope=false IMMEDIATELY (no further extraction needed) when the video is clearly about:
• Events before 1900 (ancient, medieval, early modern, 19th-century history)
• Events after 1999 (modern politics, current affairs, 21st-century topics)
• Entertainment, sports, lifestyle, humor, cooking, travel — with no 20th-century historical angle
• General business, tech, or personal-development content unrelated to historical events

Mark in_scope=true when the video is primarily about people, events, or processes from 1900–1999,
even if the video was published recently (e.g. a documentary about WWII, a biography of Stalin).

When in_scope=true, also extract:
  main_topic   – broad category in Russian (e.g. "История России", "Экономика СССР", "Биография")
  event_name   – specific event in Russian if identifiable (e.g. "Вторая мировая война")
  start_year   – first year of the event/period (1900–1999)
  end_year     – last year of the event/period (1900–1999)
  primary_year – single most representative year (1900–1999)
  confidence   – 0.0–1.0 certainty this is genuinely 20th-century content
  topics       – 2–5 specific keywords in Russian
  persons      – historical figures mentioned (full names where possible)\
"""

PARSE_SCHEMA = {
    "type": "object",
    "required": ["in_scope", "main_topic", "event_name", "start_year", "end_year", "primary_year", "confidence", "topics", "persons"],
    "additionalProperties": False,
    "properties": {
        "in_scope": {"type": "boolean"},
        "main_topic": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "event_name": {"anyOf": [{"type": "string"}, {"type": "null"}]},
        "start_year": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "end_year": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "primary_year": {"anyOf": [{"type": "integer"}, {"type": "null"}]},
        "confidence": {"anyOf": [{"type": "number"}, {"type": "null"}]},
        "topics": {"anyOf": [{"type": "array", "items": {"type": "string"}}, {"type": "null"}]},
        "persons": {"anyOf": [{"type": "array", "items": {"type": "string"}}, {"type": "null"}]},
    },
}


def build_client() -> openai.OpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        sys.exit("Error: OPENAI_API_KEY is not set.")
    return openai.OpenAI(api_key=api_key)


def _clamp_year(value: object) -> int | None:
    if not isinstance(value, int):
        return None
    return value if 1900 <= value <= 1999 else None


def parse_one(client: openai.OpenAI, title: str, description: str) -> dict | None:
    desc_snippet = (description or "")[:DESC_LIMIT]
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=512,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "video_parse",
                    "schema": PARSE_SCHEMA,
                    "strict": True,
                },
            },
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Title: {title}\nDescription: {desc_snippet}"},
            ],
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)
    except openai.APIError as exc:
        print(f"    API error: {exc}")
        return None
    except json.JSONDecodeError as exc:
        print(f"    JSON parse error: {exc}")
        return None


def save_result(conn, video_id: str, result: dict | None) -> str:
    if result is None:
        conn.execute(
            """
            INSERT INTO video_parse (video_id, parse_status, parsed_at)
            VALUES (?, 'failed', datetime('now'))
            ON CONFLICT(video_id) DO UPDATE SET
                parse_status = 'failed', parsed_at = datetime('now')
            """,
            (video_id,),
        )
        conn.commit()
        return "failed"

    if not result.get("in_scope"):
        conn.execute(
            """
            INSERT INTO video_parse (video_id, parse_status, parsed_at)
            VALUES (?, 'skipped', datetime('now'))
            ON CONFLICT(video_id) DO UPDATE SET
                parse_status = 'skipped', parsed_at = datetime('now')
            """,
            (video_id,),
        )
        conn.commit()
        return "skipped"

    # Clamp years to valid 20th-century range
    start_year = _clamp_year(result.get("start_year"))
    end_year = _clamp_year(result.get("end_year"))
    primary_year = _clamp_year(result.get("primary_year"))

    conn.execute(
        """
        INSERT INTO video_parse (
            video_id, main_topic, event_name,
            start_year, end_year, primary_year,
            confidence, parse_status, parsed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'done', datetime('now'))
        ON CONFLICT(video_id) DO UPDATE SET
            main_topic   = excluded.main_topic,
            event_name   = excluded.event_name,
            start_year   = excluded.start_year,
            end_year     = excluded.end_year,
            primary_year = excluded.primary_year,
            confidence   = excluded.confidence,
            parse_status = 'done',
            parsed_at    = datetime('now')
        """,
        (
            video_id,
            result.get("main_topic"),
            result.get("event_name"),
            start_year,
            end_year,
            primary_year,
            result.get("confidence"),
        ),
    )

    for topic_name in result.get("topics") or []:
        conn.execute("INSERT OR IGNORE INTO topics (name) VALUES (?)", (topic_name,))
        (topic_id,) = conn.execute(
            "SELECT id FROM topics WHERE name=?", (topic_name,)
        ).fetchone()
        conn.execute(
            "INSERT OR IGNORE INTO video_topics (video_id, topic_id) VALUES (?, ?)",
            (video_id, topic_id),
        )

    for person_name in result.get("persons") or []:
        conn.execute("INSERT OR IGNORE INTO persons (name) VALUES (?)", (person_name,))
        (person_id,) = conn.execute(
            "SELECT id FROM persons WHERE name=?", (person_name,)
        ).fetchone()
        conn.execute(
            "INSERT OR IGNORE INTO video_persons (video_id, person_id) VALUES (?, ?)",
            (video_id, person_id),
        )

    conn.commit()
    return "done"


def main() -> None:
    load_dotenv()
    client = build_client()
    conn = db.init_db(DB_PATH)

    rows = conn.execute(
        """
        SELECT v.video_id, v.title, v.description
        FROM videos v
        LEFT JOIN video_parse vp ON v.video_id = vp.video_id
        WHERE vp.video_id IS NULL OR vp.parse_status = 'pending'
        ORDER BY v.published_at DESC
        """
    ).fetchall()

    total = len(rows)
    if total == 0:
        print("No videos to parse.")
        conn.close()
        return

    print(f"Videos to parse: {total}")
    counts = {"done": 0, "skipped": 0, "failed": 0}

    for i, (video_id, title, description) in enumerate(rows, 1):
        label = f"[{i}/{total}]"
        print(f"{label} {title[:65]}", end=" … ", flush=True)

        result = parse_one(client, title, description)
        status = save_result(conn, video_id, result)
        counts[status] += 1

        if status == "done":
            yr = result.get("primary_year", "?") if result else "?"
            topic = (result.get("main_topic") or "")[:30] if result else ""
            print(f"✓  {yr} | {topic}")
        elif status == "skipped":
            print("–  out of scope")
        else:
            print("✗  failed")

    conn.close()
    print(
        f"\nDone. In-scope: {counts['done']}, "
        f"Skipped: {counts['skipped']}, "
        f"Failed: {counts['failed']}"
    )


if __name__ == "__main__":
    main()
