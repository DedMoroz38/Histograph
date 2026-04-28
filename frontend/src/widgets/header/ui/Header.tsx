"use client";

import { SortBar } from "@/features/sort/ui/SortBar";
import { SearchBar } from "@/features/search/ui/SearchBar";
import type { SortMode } from "@/features/sort/ui/SortBar";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";
import type { HistoricEvent, EventId } from "@/entities/event/model/events";

interface Props {
  pal: Palette;
  allVideos: Video[];
  events: HistoricEvent[];
  sortBy: SortMode;
  setSortBy: (m: SortMode) => void;
  filteredCount: number;
  totalCount: number;
  onSelectVideo: (v: Video) => void;
  onJumpToEvent: (ev: HistoricEvent) => void;
  onSetEventFilter: (id: EventId) => void;
}

export function Header({
  pal,
  allVideos,
  events,
  sortBy,
  setSortBy,
  filteredCount,
  totalCount,
  onSelectVideo,
  onJumpToEvent,
  onSetEventFilter,
}: Props) {
  return (
    <div
      style={{
        height: 52,
        flexShrink: 0,
        borderBottom: `1px solid ${pal.border}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
        gap: 16,
        background: pal.bg,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 20,
          fontWeight: 700,
          color: pal.text,
          letterSpacing: "-0.025em",
          flexShrink: 0,
        }}
      >
        Histograph
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 400,
            fontStyle: "italic",
            color: pal.textDim,
            marginLeft: 8,
          }}
        >
          XX век
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <SortBar pal={pal} sortBy={sortBy} setSortBy={setSortBy} />
      <SearchBar
        pal={pal}
        allVideos={allVideos}
        events={events}
        onSelectVideo={onSelectVideo}
        onJumpToEvent={onJumpToEvent}
        onSetEventFilter={onSetEventFilter}
      />

      <div
        style={{
          fontSize: 11,
          color: pal.textDim,
          fontWeight: 500,
          flexShrink: 0,
          minWidth: 60,
          textAlign: "right",
        }}
      >
        {filteredCount < totalCount ? (
          <>
            <span style={{ color: pal.text, fontWeight: 700 }}>{filteredCount}</span>{" "}
            / {totalCount}
          </>
        ) : (
          <>{totalCount} видео</>
        )}
      </div>
    </div>
  );
}
