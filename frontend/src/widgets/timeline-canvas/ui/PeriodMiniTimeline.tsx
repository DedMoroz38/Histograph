"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { VideoCard } from "@/entities/video/ui/VideoCard";
import {
  LPAD, RPAD, CW,
  ROWS_COMFORT, ROWS_COMPACT, CH_COMFORT, CH_COMPACT,
  PERIODS,
} from "@/shared/config/timeline";
import { THEME_COLOR } from "@/shared/config/themes";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";

type Period = (typeof PERIODS)[number];

interface Props {
  period: Period;
  videos: Video[];
  pal: Palette;
  density: "comfortable" | "compact";
  watched: Set<string>;
  onToggleWatch: (id: string) => void;
  onSelect: (v: Video) => void;
}

export function PeriodMiniTimeline({
  period,
  videos,
  pal,
  density,
  watched,
  onToggleWatch,
  onSelect,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280);

  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) setContainerWidth(wrapperRef.current.clientWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const rows = density === "comfortable" ? ROWS_COMFORT : ROWS_COMPACT;
  const ch = density === "comfortable" ? CH_COMFORT : CH_COMPACT;
  const thH = density === "comfortable" ? 96 : 72;
  const canH = rows[rows.length - 1] + ch + 56;

  const spanYears = period.end - period.start;
  const periodPX = Math.max(120, (containerWidth - LPAD - RPAD) / spanYears);
  const canvasW = Math.max(containerWidth, LPAD + spanYears * periodPX + RPAD);

  const xOf = (year: number) => LPAD + (year - period.start) * periodPX;

  // Year tick interval based on period length
  const tickInterval = spanYears <= 5 ? 1 : spanYears <= 20 ? 5 : 10;
  const ticks: number[] = [];
  for (let y = period.start; y <= period.end; y += tickInterval) ticks.push(y);

  // Smart row assignment using periodPX for clearance
  const smartRows = useMemo(() => {
    const yearSorted = [...videos].sort((a, b) => a.year - b.year);
    const lastYear: number[] = Array(rows.length).fill(-Infinity);
    const map = new Map<string, number>();
    for (const v of yearSorted) {
      let best = -1, bestClr = -Infinity;
      for (let r = 0; r < rows.length; r++) {
        const clr = (v.year - lastYear[r]) * periodPX - CW;
        if (clr >= 0 && clr > bestClr) { bestClr = clr; best = r; }
      }
      if (best === -1) {
        best = lastYear.indexOf(Math.min(...lastYear));
      }
      map.set(v.id, best);
      lastYear[best] = v.year;
    }
    return map;
  }, [videos, rows, periodPX]);

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: 1,
        overflowX: "auto",
        overflowY: "auto",
        background: pal.bg,
        position: "relative",
      }}
    >
      <div style={{ width: canvasW, height: canH, position: "relative" }}>

        {/* Alternating row bands */}
        {rows.map((top, i) =>
          i % 2 === 1 ? (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                top: top - 10,
                width: canvasW,
                height: ch + 20,
                background: `${pal.border}28`,
                pointerEvents: "none",
              }}
            />
          ) : null
        )}

        {/* Year tick lines */}
        {ticks.map((y) => (
          <div key={y}>
            <div
              style={{
                position: "absolute",
                left: xOf(y),
                top: 0,
                width: 1,
                height: canH,
                background: pal.border,
                opacity: 0.5,
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: xOf(y) + 4,
                top: 6,
                fontSize: 10,
                fontWeight: 600,
                color: pal.textDim,
                fontVariantNumeric: "tabular-nums",
                pointerEvents: "none",
              }}
            >
              {y}
            </span>
          </div>
        ))}

        {/* Connector lines */}
        {videos.map((v) => {
          const top = rows[smartRows.get(v.id) ?? v.row] + ch;
          return (
            <div
              key={`c${v.id}`}
              style={{
                position: "absolute",
                left: xOf(v.year),
                top,
                width: 1,
                height: canH - top,
                background: `${THEME_COLOR[v.theme]}33`,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Video cards */}
        {videos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            pal={pal}
            watched={watched}
            onToggleWatch={onToggleWatch}
            onSelect={onSelect}
            dimmed={false}
            highlighted={false}
            cardHeight={ch}
            thumbHeight={thH}
            x={xOf(v.year)}
            y={rows[smartRows.get(v.id) ?? v.row]}
          />
        ))}
      </div>
    </div>
  );
}
