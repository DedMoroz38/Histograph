import type { EventId } from "@/entities/event/model/events";
import type { Theme } from "@/shared/config/themes";

export interface Video {
  id: string;          // video_id from DB
  title: string;
  channel: string;     // channels.name
  channelHandle: string;
  url: string;
  publishedAt: string;
  year: number;        // primary_year (clamped 1900–1999)
  startYear: number | null;
  endYear: number | null;
  mainTopic: string | null;
  eventName: string | null;
  confidence: number | null;
  topics: string[];
  persons: string[];
  events: EventId[];   // derived from year overlap
  theme: Theme;        // derived from mainTopic text
  row: number;         // 0 | 1 | 2, derived from video_id hash
  duration: string | null;
  thumbnailUrl: string | null;
  channelLogoUrl: string | null;
}
