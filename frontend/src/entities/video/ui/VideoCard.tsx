"use client";

import { useState } from "react";
import { Thumbnail } from "./Thumbnail";
import { THEME_COLOR, THEME_LABEL } from "@/shared/config/themes";
import { CW } from "@/shared/config/timeline";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "../model/types";

interface Props {
  video: Video;
  pal: Palette;
  watched: Set<string>;
  onToggleWatch: (id: string) => void;
  onSelect: (v: Video) => void;
  dimmed: boolean;
  highlighted: boolean;
  cardHeight: number;
  thumbHeight: number;
  x: number;
  y: number;
}

export function VideoCard({
  video,
  pal,
  watched,
  onToggleWatch,
  onSelect,
  dimmed,
  highlighted,
  cardHeight,
  thumbHeight,
  x,
  y,
}: Props) {
  const [hov, setHov] = useState(false);
  const tc = THEME_COLOR[video.theme];
  const isW = watched.has(video.id);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(video)}
      style={{
        position: "absolute",
        left: x - CW / 2,
        top: y,
        width: CW,
        height: cardHeight,
        background: pal.surface,
        borderRadius: 3,
        cursor: "pointer",
        overflow: "visible",
        border: `1px solid ${hov || highlighted ? tc : pal.border}`,
        borderTop: `3px solid ${tc}`,
        opacity: dimmed ? 0.14 : isW ? 0.72 : 1,
        boxShadow: highlighted
          ? `0 0 0 2px ${tc}, 0 8px 28px rgba(0,0,0,0.15)`
          : hov
          ? "0 6px 24px rgba(0,0,0,0.13)"
          : "0 1px 5px rgba(0,0,0,0.07)",
        transform: hov ? "translateY(-3px)" : "none",
        transition: "all 0.17s ease",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: -22,
            left: "50%",
            transform: "translateX(-50%)",
            background: tc,
            color: "#fff",
            fontSize: 8.5,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            zIndex: 3,
          }}
        >
          ★ в выборке
        </div>
      )}

      <div style={{ overflow: "hidden", borderRadius: "2px 2px 0 0" }}>
        <Thumbnail
          channel={video.channel}
          height={thumbHeight}
          duration={video.duration}
        />
      </div>

      <div
        style={{
          padding: "8px 10px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            lineHeight: 1.35,
            color: pal.text,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {video.title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: tc,
            }}
          >
            {THEME_LABEL[video.theme]}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatch(video.id);
            }}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "2px 4px",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: isW ? "#2d7d59" : pal.textDim,
              transition: "color 0.15s",
            }}
          >
            {isW ? "✓ просмотр." : "отметить"}
          </button>
        </div>
      </div>

      {/* Connector dot */}
      <div
        style={{
          position: "absolute",
          bottom: -7,
          left: "50%",
          transform: "translateX(-50%)",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: tc,
          border: `2px solid ${pal.bg}`,
          zIndex: 2,
        }}
      />
    </div>
  );
}
