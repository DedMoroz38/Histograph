import type { NextRequest } from "next/server";
import { getDb } from "@/shared/lib/db";
import { EVENTS, deriveEvents } from "@/entities/event/model/events";
import { deriveTheme } from "@/shared/config/themes";
import type { Video } from "@/entities/video/model/types";

function deriveRow(videoId: string): number {
  let hash = 0;
  for (const c of videoId) hash = (hash * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return hash % 3;
}

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";

  if (!q) return Response.json({ videos: [], events: [] });

  // Search events
  const matchedEvents = EVENTS.filter((e) =>
    e.label.toLowerCase().includes(q)
  ).slice(0, 4);

  // Search videos from DB
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT
        v.video_id, v.title, v.url, v.published_at,
        v.thumbnail_url,
        c.name AS channel, c.handle AS channel_handle, c.logo_url AS channel_logo_url,
        vp.primary_year, vp.start_year, vp.end_year,
        vp.main_topic, vp.event_name, vp.confidence,
        GROUP_CONCAT(DISTINCT t.name)  AS topics,
        GROUP_CONCAT(DISTINCT p.name)  AS persons
      FROM videos v
      JOIN channels c     ON v.channel_id  = c.id
      JOIN video_parse vp ON v.video_id    = vp.video_id
      LEFT JOIN video_topics  vt  ON v.video_id = vt.video_id
      LEFT JOIN topics        t   ON vt.topic_id  = t.id
      LEFT JOIN video_persons vpe ON v.video_id = vpe.video_id
      LEFT JOIN persons       p   ON vpe.person_id = p.id
      WHERE vp.parse_status = 'done'
        AND vp.primary_year IS NOT NULL
        AND (
          LOWER(v.title)       LIKE '%' || ? || '%'
          OR LOWER(c.name)     LIKE '%' || ? || '%'
          OR CAST(vp.primary_year AS TEXT) LIKE '%' || ? || '%'
          OR LOWER(vp.main_topic)  LIKE '%' || ? || '%'
          OR LOWER(vp.event_name)  LIKE '%' || ? || '%'
        )
      GROUP BY v.video_id
      ORDER BY vp.primary_year ASC
      LIMIT 6
    `
    )
    .all(q, q, q, q, q) as Record<string, unknown>[];

  const videos: Video[] = rows.map((r) => {
    const year = r.primary_year as number;
    const mainTopic = (r.main_topic as string | null) ?? null;
    const eventName = (r.event_name as string | null) ?? null;
    return {
      id: r.video_id as string,
      title: r.title as string,
      channel: r.channel as string,
      channelHandle: (r.channel_handle as string | null) ?? "",
      url: r.url as string,
      publishedAt: r.published_at as string,
      year,
      startYear: (r.start_year as number | null) ?? null,
      endYear: (r.end_year as number | null) ?? null,
      mainTopic,
      eventName,
      confidence: (r.confidence as number | null) ?? null,
      topics: r.topics ? (r.topics as string).split(",") : [],
      persons: r.persons ? (r.persons as string).split(",") : [],
      events: deriveEvents(year),
      theme: deriveTheme(mainTopic, eventName),
      row: deriveRow(r.video_id as string),
      duration: null,
      thumbnailUrl: (r.thumbnail_url as string | null) ?? null,
      channelLogoUrl: (r.channel_logo_url as string | null) ?? null,
    };
  });

  return Response.json({ videos, events: matchedEvents });
}
