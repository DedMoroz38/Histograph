"use client";

import { THEME_COLOR, THEME_LABEL, CHANNEL_HUE } from "@/shared/config/themes";
import { EVENTS } from "@/entities/event/model/events";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";
import type { SortMode } from "@/features/sort/ui/SortBar";

interface Props {
  videos: Video[];
  pal: Palette;
  sortBy: SortMode;
  watched: Set<string>;
  onToggleWatch: (id: string) => void;
  onSelect: (v: Video) => void;
}

function getGroup(v: Video, sortBy: SortMode): string {
  if (sortBy === "theme") return THEME_LABEL[v.theme];
  if (sortBy === "channel") return v.channel;
  if (sortBy === "duration") {
    if (!v.duration) return "Неизвестно";
    const mins = parseInt(v.duration.split(":")[0]);
    if (mins < 20) return "< 20 мин";
    if (mins < 35) return "20–35 мин";
    return "> 35 мин";
  }
  return "";
}

export function SortedListView({
  videos,
  pal,
  sortBy,
  watched,
  onToggleWatch,
  onSelect,
}: Props) {
  const sortLabel: Record<SortMode, string | null> = {
    year: null,
    duration: "⏱ по длине",
    theme: "◈ по теме",
    channel: "@ по каналу",
  };

  const groups: { label: string; items: Video[] }[] = [];
  let lastG: string | null = null;
  videos.forEach((v) => {
    const g = getGroup(v, sortBy);
    if (g !== lastG) {
      groups.push({ label: g, items: [] });
      lastG = g;
    }
    groups[groups.length - 1].items.push(v);
  });

  return (
    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: pal.textDim,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          marginBottom: 14,
          paddingBottom: 10,
          borderBottom: `1px solid ${pal.border}`,
        }}
      >
        {sortLabel[sortBy]} · {videos.length} видео
      </div>

      {groups.map((grp) => (
        <div key={grp.label} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: pal.textDim,
              padding: "8px 0 8px",
              borderBottom: `1px solid ${pal.border}`,
              marginBottom: 8,
            }}
          >
            {grp.label}
          </div>

          {grp.items.map((v) => {
            const tc = THEME_COLOR[v.theme];
            const isW = watched.has(v.id);
            const videoEvents = EVENTS.filter((e) => v.events.includes(e.id));
            return (
              <div
                key={v.id}
                onClick={() => onSelect(v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "9px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  border: "1px solid transparent",
                  transition: "all 0.13s",
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = pal.bg;
                  e.currentTarget.style.borderColor = pal.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: tc, flexShrink: 0 }} />
                <div
                  style={{
                    width: 36,
                    height: 22,
                    borderRadius: 2,
                    flexShrink: 0,
                    background: tc,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {v.year}
                </div>
                {/* Video thumbnail */}
                {v.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    style={{
                      width: 64,
                      height: 36,
                      objectFit: "cover",
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 36,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: `oklch(0.86 0.06 ${CHANNEL_HUE[v.channel] ?? 180})`,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: pal.text,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      opacity: isW ? 0.6 : 1,
                    }}
                  >
                    {isW && <span style={{ color: "#2d7d59", marginRight: 5 }}>✓</span>}
                    {v.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: pal.textDim, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    {v.channelLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.channelLogoUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: `oklch(0.72 0.08 ${CHANNEL_HUE[v.channel] ?? 180})`,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    {v.channel}{v.duration ? ` · ${v.duration}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {videoEvents.slice(0, 2).map((ev) => (
                    <span
                      key={ev.id}
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: ev.color,
                        border: `1px solid ${ev.color}55`,
                        padding: "1px 6px",
                        borderRadius: 10,
                      }}
                    >
                      {ev.label}
                    </span>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatch(v.id); }}
                    style={{
                      border: `1px solid ${isW ? "#2d7d59" : pal.border}`,
                      background: "transparent",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      color: isW ? "#2d7d59" : pal.textDim,
                    }}
                  >
                    {isW ? "✓" : "+ смотрел"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
