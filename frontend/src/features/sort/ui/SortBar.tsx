"use client";

import type { Palette } from "@/shared/config/palette";

export type SortMode = "year" | "duration" | "theme" | "channel";

interface Props {
  pal: Palette;
  sortBy: SortMode;
  setSortBy: (m: SortMode) => void;
}

const OPTS: { id: SortMode; label: string }[] = [
  { id: "year",     label: "По году" },
  { id: "duration", label: "По длине" },
  { id: "theme",    label: "По теме" },
  { id: "channel",  label: "По каналу" },
];

export function SortBar({ pal, sortBy, setSortBy }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 10.5, color: pal.textDim, fontWeight: 500, flexShrink: 0 }}>
        Сортировка:
      </span>
      {OPTS.map((o) => {
        const active = sortBy === o.id;
        return (
          <button
            key={o.id}
            onClick={() => setSortBy(o.id)}
            style={{
              height: 26,
              padding: "0 9px",
              borderRadius: 4,
              fontSize: 10.5,
              border: `1px solid ${active ? "#c84b31" : pal.border}`,
              background: active ? "#c84b3114" : "transparent",
              color: active ? "#c84b31" : pal.textDim,
              cursor: "pointer",
              fontWeight: active ? 700 : 400,
              transition: "all 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
