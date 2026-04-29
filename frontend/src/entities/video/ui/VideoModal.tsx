"use client";

import { useEffect } from "react";
import { THEME_COLOR, THEME_LABEL, CHANNEL_HUE } from "@/shared/config/themes";
import { EVENTS } from "@/entities/event/model/events";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "../model/types";
import type { EventId } from "@/entities/event/model/events";

interface Props {
  video: Video;
  pal: Palette;
  watched: Set<string>;
  allVideos: Video[];
  onClose: () => void;
  onToggleWatch: (id: string) => void;
  onSetEventFilter: (id: EventId) => void;
  onJumpToEvent: (ev: { years: [number, number] }) => void;
}

export function VideoModal({
  video,
  pal,
  watched,
  allVideos,
  onClose,
  onToggleWatch,
  onSetEventFilter,
  onJumpToEvent,
}: Props) {
  const isW = watched.has(video.id);
  const tc = THEME_COLOR[video.theme];
  const hue = CHANNEL_HUE[video.channel] ?? 180;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const related = allVideos
    .filter((v) => v.id !== video.id && Math.abs(v.year - video.year) <= 8)
    .slice(0, 3);

  const videoEvents = EVENTS.filter((e) => video.events.includes(e.id));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520,
          background: pal.surface,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
          borderTop: `4px solid ${tc}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail area */}
        <div
          style={{
            height: 220,
            position: "relative",
            background: `oklch(0.86 0.06 ${hue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `repeating-linear-gradient(-45deg,transparent 0,transparent 13px,oklch(0.76 0.06 ${hue}) 13px,oklch(0.76 0.06 ${hue}) 14px)`,
              opacity: 0.4,
            }}
          />
          {/* Real thumbnail */}
          {video.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={video.thumbnailUrl}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, transparent 30%, oklch(0.40 0.08 ${hue}) 100%)`,
            }}
          />
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#fff",
              cursor: "pointer",
              zIndex: 1,
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            ▶
          </a>
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 2,
              background: `${tc}dd`,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 3,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {THEME_LABEL[video.theme]}
          </div>
          {video.duration && (
            <div
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                zIndex: 2,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: 12,
                padding: "3px 8px",
                borderRadius: 3,
              }}
            >
              {video.duration}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {video.channelLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.channelLogoUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: `oklch(0.72 0.08 ${hue})`,
                  border: "2px solid rgba(255,255,255,0.5)",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {video.channel}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px 22px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, marginRight: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: tc,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 4,
                }}
              >
                {video.year}
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: pal.text,
                  lineHeight: 1.25,
                  fontFamily: "var(--font-serif)",
                }}
              >
                {video.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 18,
                color: pal.textDim,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Event tags */}
          {videoEvents.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: pal.textDim,
                  fontWeight: 500,
                  alignSelf: "center",
                }}
              >
                Событие:
              </span>
              {videoEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    onSetEventFilter(ev.id);
                    onJumpToEvent(ev);
                    onClose();
                  }}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: ev.color,
                    border: `1px solid ${ev.color}55`,
                    borderRadius: 12,
                    padding: "3px 10px",
                    background: `${ev.color}0e`,
                    cursor: "pointer",
                    transition: "all 0.13s",
                  }}
                >
                  {ev.label} →
                </button>
              ))}
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: pal.textDim,
                marginBottom: 14,
                lineHeight: 1.6,
                borderLeft: `2px solid ${pal.border}`,
                paddingLeft: 10,
              }}
            >
              Связанные:{" "}
              {related.map((v) => (
                <span
                  key={v.id}
                  style={{
                    color: THEME_COLOR[v.theme],
                    marginRight: 8,
                    fontWeight: 500,
                  }}
                >
                  {v.year} {v.title}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                height: 40,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                background: "#e63946",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 16 }}>▶</span> Открыть на YouTube
            </a>
            <button
              onClick={() => onToggleWatch(video.id)}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 4,
                cursor: "pointer",
                border: `1px solid ${isW ? "#2d7d59" : pal.border}`,
                background: isW ? "#2d7d5918" : "transparent",
                color: isW ? "#2d7d59" : pal.textMid,
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {isW ? "✓ Просмотрено" : "Отметить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
