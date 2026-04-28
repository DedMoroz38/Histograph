"use client";

import { useState, useEffect, useRef } from "react";
import { THEME_COLOR } from "@/shared/config/themes";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";
import type { HistoricEvent, EventId } from "@/entities/event/model/events";

interface Props {
  pal: Palette;
  allVideos: Video[];
  events: HistoricEvent[];
  onSelectVideo: (v: Video) => void;
  onJumpToEvent: (ev: HistoricEvent) => void;
  onSetEventFilter: (id: EventId) => void;
}

export function SearchBar({
  pal,
  allVideos,
  events,
  onSelectVideo,
  onJumpToEvent,
  onSetEventFilter,
}: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const q_lo = q.toLowerCase().trim();

  const videoResults =
    q_lo.length >= 1
      ? allVideos
          .filter(
            (v) =>
              v.title.toLowerCase().includes(q_lo) ||
              v.channel.toLowerCase().includes(q_lo) ||
              String(v.year).includes(q_lo)
          )
          .slice(0, 6)
      : [];

  const eventResults =
    q_lo.length >= 1
      ? events.filter((e) => e.label.toLowerCase().includes(q_lo)).slice(0, 4)
      : [];

  const hasResults = videoResults.length > 0 || eventResults.length > 0;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (video: Video) => {
    onSelectVideo(video);
    setQ("");
    setOpen(false);
  };

  const pickEvent = (ev: HistoricEvent) => {
    onJumpToEvent(ev);
    onSetEventFilter(ev.id);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        style={{
          height: 34,
          width: 260,
          borderRadius: 5,
          border: `1.5px solid ${open ? "#c84b31" : pal.border}`,
          background: pal.surface,
          display: "flex",
          alignItems: "center",
          paddingLeft: 10,
          gap: 7,
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontSize: 15, color: pal.textDim, lineHeight: 1, flexShrink: 0 }}>⌕</span>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск видео, событий..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: pal.text,
            fontSize: 12.5,
            lineHeight: 1,
          }}
        />
        {q && (
          <button
            onClick={() => { setQ(""); setOpen(false); }}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: pal.textDim,
              fontSize: 13,
              padding: "0 6px 0 0",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && hasResults && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 0,
            width: 320,
            zIndex: 600,
            background: pal.surface,
            borderRadius: 6,
            border: `1px solid ${pal.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {eventResults.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: pal.textDim,
                  padding: "9px 14px 5px",
                }}
              >
                События
              </div>
              {eventResults.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => pickEvent(ev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = pal.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: pal.text }}>{ev.label}</div>
                    <div style={{ fontSize: 10.5, color: pal.textDim }}>
                      {ev.years[0]}–{ev.years[1]} · {allVideos.filter((v) => v.events.includes(ev.id)).length} видео
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: ev.color, fontWeight: 600 }}>Перейти →</span>
                </div>
              ))}
            </div>
          )}

          {videoResults.length > 0 && (
            <div style={{ borderTop: eventResults.length > 0 ? `1px solid ${pal.border}` : "none" }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: pal.textDim,
                  padding: "9px 14px 5px",
                }}
              >
                Видео
              </div>
              {videoResults.map((v) => {
                const tc = THEME_COLOR[v.theme];
                return (
                  <div
                    key={v.id}
                    onClick={() => pick(v)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "7px 14px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = pal.bg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: tc, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 500,
                          color: pal.text,
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {v.title}
                      </div>
                      <div style={{ fontSize: 10, color: pal.textDim, marginTop: 2 }}>
                        {v.year} · {v.channel}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
