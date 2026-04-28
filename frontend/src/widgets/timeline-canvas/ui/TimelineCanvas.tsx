"use client";

import { useMemo } from "react";
import { VideoCard } from "@/entities/video/ui/VideoCard";
import { SortedListView } from "./SortedListView";
import {
  TW, CW, ROWS_COMFORT, ROWS_COMPACT, CH_COMFORT, CH_COMPACT,
  xOf, DECADES,
} from "@/shared/config/timeline";
import { EVENTS } from "@/entities/event/model/events";
import { THEME_COLOR } from "@/shared/config/themes";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";
import type { Theme } from "@/shared/config/themes";
import type { EventId } from "@/entities/event/model/events";
import type { SortMode } from "@/features/sort/ui/SortBar";

interface Props {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  pal: Palette;
  activeTheme: Theme | null;
  activeEventId: EventId | null;
  watched: Set<string>;
  onToggleWatch: (id: string) => void;
  onSelect: (v: Video) => void;
  density: "comfortable" | "compact";
  sortBy: SortMode;
  videos: Video[];
}

export function TimelineCanvas({
  scrollRef,
  onScroll,
  pal,
  activeTheme,
  activeEventId,
  watched,
  onToggleWatch,
  onSelect,
  density,
  sortBy,
  videos,
}: Props) {
  const rows = density === "comfortable" ? ROWS_COMFORT : ROWS_COMPACT;
  const ch = density === "comfortable" ? CH_COMFORT : CH_COMPACT;
  const thH = density === "comfortable" ? 96 : 72;
  const canH = rows[2] + ch + 56;

  const showSorted = sortBy !== "year";

  const activeEventVideoIds = useMemo(() => {
    if (!activeEventId) return null;
    return new Set(videos.filter((v) => v.events.includes(activeEventId)).map((v) => v.id));
  }, [activeEventId, videos]);

  const sortedVideos = useMemo(() => {
    const base = activeEventVideoIds
      ? videos.filter((v) => activeEventVideoIds.has(v.id))
      : videos;
    if (sortBy === "year") return [...base].sort((a, b) => a.year - b.year);
    if (sortBy === "duration") {
      const toSecs = (d: string | null) => {
        if (!d) return 0;
        const [m, s] = d.split(":");
        return +m * 60 + +s;
      };
      return [...base].sort((a, b) => toSecs(b.duration) - toSecs(a.duration));
    }
    if (sortBy === "theme") return [...base].sort((a, b) => a.theme.localeCompare(b.theme));
    if (sortBy === "channel") return [...base].sort((a, b) => a.channel.localeCompare(b.channel));
    return base;
  }, [sortBy, activeEventId, videos]);

  const activeEvent = activeEventId ? EVENTS.find((e) => e.id === activeEventId) : null;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      style={{
        flex: 1,
        overflowX: showSorted ? "hidden" : "auto",
        overflowY: showSorted ? "auto" : "hidden",
        position: "relative",
        background: pal.bg,
      }}
    >
      {showSorted ? (
        <SortedListView
          videos={sortedVideos}
          pal={pal}
          sortBy={sortBy}
          watched={watched}
          onToggleWatch={onToggleWatch}
          onSelect={onSelect}
        />
      ) : (
        <div style={{ width: TW, height: canH, position: "relative" }}>
          {/* Decade vertical grid lines */}
          {DECADES.map((d) => (
            <div
              key={d}
              style={{
                position: "absolute",
                left: xOf(d),
                top: 0,
                width: 1,
                height: canH,
                background: pal.border,
                opacity: 0.6,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Alternating row band */}
          {rows.map((top, i) =>
            i % 2 === 1 ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: top - 10,
                  width: TW,
                  height: ch + 20,
                  background: `${pal.border}28`,
                  pointerEvents: "none",
                }}
              />
            ) : null
          )}

          {/* Connector lines */}
          {videos.map((v) => {
            const cx = xOf(v.year);
            const top = rows[v.row] + ch;
            return (
              <div
                key={`c${v.id}`}
                style={{
                  position: "absolute",
                  left: cx,
                  top,
                  width: 1,
                  height: canH - top,
                  background: `${THEME_COLOR[v.theme]}33`,
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Active event span */}
          {activeEvent && (() => {
            const x1 = xOf(activeEvent.years[0]) - 30;
            const x2 = xOf(activeEvent.years[1]) + 30;
            return (
              <div
                style={{
                  position: "absolute",
                  left: x1,
                  top: 0,
                  width: x2 - x1,
                  height: canH,
                  background: `${activeEvent.color}0d`,
                  borderLeft: `2px dashed ${activeEvent.color}55`,
                  borderRight: `2px dashed ${activeEvent.color}55`,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: activeEvent.color,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  {activeEvent.label}
                </div>
              </div>
            );
          })()}

          {/* Video cards */}
          {videos.map((v) => {
            const inEvent = activeEventVideoIds ? activeEventVideoIds.has(v.id) : false;
            const highlighted = !!activeEventVideoIds && inEvent;
            const dimmed =
              (activeTheme ? v.theme !== activeTheme : false) ||
              (activeEventVideoIds ? !inEvent : false);
            return (
              <VideoCard
                key={v.id}
                video={v}
                pal={pal}
                watched={watched}
                onToggleWatch={onToggleWatch}
                onSelect={onSelect}
                dimmed={dimmed}
                highlighted={highlighted}
                cardHeight={ch}
                thumbHeight={thH}
                x={xOf(v.year)}
                y={rows[v.row]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
