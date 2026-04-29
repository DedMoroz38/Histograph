"use client";

import { Thumbnail } from "@/entities/video/ui/Thumbnail";
import { THEME_COLOR, THEME_LABEL, CHANNEL_HUE } from "@/shared/config/themes";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";

interface Props {
  videos: Video[];
  pal: Palette;
  watched: Set<string>;
  onToggleWatch: (id: string) => void;
  onSelect: (v: Video) => void;
}

export function VideoGridView({ videos, pal, watched, onToggleWatch, onSelect }: Props) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px 24px",
        background: pal.bg,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 14,
        }}
      >
        {videos.map((v) => {
          const tc = THEME_COLOR[v.theme];
          const hue = CHANNEL_HUE[v.channel] ?? 180;
          const isWatched = watched.has(v.id);
          return (
            <div
              key={v.id}
              onClick={() => onSelect(v)}
              style={{
                background: pal.surface,
                borderRadius: 4,
                overflow: "hidden",
                borderTop: `3px solid ${tc}`,
                cursor: "pointer",
                opacity: isWatched ? 0.72 : 1,
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.13)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}
            >
              <Thumbnail
                channel={v.channel}
                thumbnailUrl={v.thumbnailUrl}
                height={96}
                duration={v.duration}
              />
              <div style={{ padding: "8px 10px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: tc, letterSpacing: "0.04em" }}>
                  {v.year}
                </span>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: pal.text,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {v.title}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: pal.textDim,
                    marginTop: "auto",
                    paddingTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: `oklch(0.72 0.10 ${hue})`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 8,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {v.channel[0]?.toUpperCase()}
                  </div>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {v.channel}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: tc,
                    }}
                  >
                    {THEME_LABEL[v.theme]}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatch(v.id); }}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: isWatched ? "#2d7d59" : pal.textDim,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isWatched ? "✓ просм." : "отметить"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
