"use client";

import { useRef, useState, useEffect } from "react";
import { TW, xOf, DECADES, PERIODS, LPAD, RPAD } from "@/shared/config/timeline";
import { THEME_COLOR, THEME_LABEL } from "@/shared/config/themes";
import { EVENTS } from "@/entities/event/model/events";
import type { Palette } from "@/shared/config/palette";
import type { Video } from "@/entities/video/model/types";
import type { EventId } from "@/entities/event/model/events";

const STRIP_H = 160;
const BAND_H = 32;
const AX_TOP = BAND_H + 14;

interface Props {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  pal: Palette;
  dark: boolean;
  showPeriodBands: boolean;
  activeEventId: EventId | null;
  activePeriodIdx: number | null;
  onPeriodClick: (idx: number) => void;
  videos: Video[];
}

export function TimelineStrip({
  scrollRef,
  onScroll,
  pal,
  dark,
  showPeriodBands,
  activeEventId,
  activePeriodIdx,
  onPeriodClick,
  videos,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const activeEvent = activeEventId ? EVENTS.find((e) => e.id === activeEventId) : null;

  if (activePeriodIdx !== null) {
    const period = PERIODS[activePeriodIdx];
    const spanYears = period.end - period.start;
    const periodPX = Math.max(76, (containerWidth - LPAD - RPAD) / spanYears);
    const periodW = Math.max(containerWidth, LPAD + spanYears * periodPX + RPAD);
    const xP = (year: number) => LPAD + (year - period.start) * periodPX;
    const tickInterval = spanYears <= 5 ? 1 : spanYears <= 20 ? 5 : 10;
    const ticks: number[] = [];
    for (let y = period.start; y <= period.end; y += tickInterval) ticks.push(y);

    return (
      <div
        ref={containerRef}
        style={{ height: STRIP_H, flexShrink: 0, background: pal.stripBg, borderTop: `1px solid ${pal.border}` }}
      >
        <div style={{ height: "100%", overflowX: "auto", overflowY: "hidden" }}>
          <div style={{ width: periodW, height: STRIP_H, position: "relative" }}>
            {/* Period band filling full width */}
            <div
              onClick={() => onPeriodClick(activePeriodIdx)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: periodW,
                height: BAND_H,
                background: `oklch(0.78 0.07 ${period.h} / ${dark ? 0.42 : 0.28})`,
                borderBottom: `2px solid oklch(0.72 0.14 ${period.h})`,
                display: "flex",
                alignItems: "center",
                paddingLeft: LPAD,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: `oklch(${dark ? 0.85 : 0.52} 0.12 ${period.h})`,
                }}
              >
                {period.label}
              </span>
            </div>

            {/* Horizontal axis line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: AX_TOP + 18,
                width: periodW,
                height: 1,
                background: pal.border,
              }}
            />

            {/* Year ticks + labels */}
            {ticks.map((y) => (
              <div key={y}>
                <div
                  style={{
                    position: "absolute",
                    left: xP(y),
                    top: AX_TOP + 4,
                    width: 1,
                    height: 14,
                    background: pal.textDim,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: xP(y) + 3,
                    top: AX_TOP + 3,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: pal.textMid,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {y}
                </span>
              </div>
            ))}

            {/* Video dots */}
            {videos.map((v) => {
              const dimmed = activeEventId && !v.events.includes(activeEventId);
              return (
                <div
                  key={v.id}
                  title={`${v.year} — ${v.title}`}
                  style={{
                    position: "absolute",
                    left: xP(v.year) - 4,
                    top: AX_TOP + 12,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: dimmed ? pal.border : THEME_COLOR[v.theme],
                    border: `2px solid ${pal.stripBg}`,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                />
              );
            })}

            {/* Legend */}
            <div style={{ position: "absolute", left: LPAD, bottom: 16, display: "flex", gap: 16 }}>
              {(Object.keys(THEME_COLOR) as Array<keyof typeof THEME_COLOR>).map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: THEME_COLOR[t] }} />
                  <span style={{ fontSize: 10, color: pal.textDim, fontWeight: 500 }}>
                    {THEME_LABEL[t]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: STRIP_H,
        flexShrink: 0,
        background: pal.stripBg,
        borderTop: `1px solid ${pal.border}`,
      }}
    >
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ height: "100%", overflowX: "auto", overflowY: "hidden" }}
      >
        <div style={{ width: TW, height: STRIP_H, position: "relative" }}>
          {/* Period bands */}
          {showPeriodBands &&
            PERIODS.map((p, i) => {
              const x = xOf(p.start);
              const w = (p.end - p.start) * 76;
              const isActive = activePeriodIdx === i;
              const a = isActive ? (dark ? 0.42 : 0.28) : (dark ? 0.22 : 0.14);
              const hue = p.h;
              return (
                <div
                  key={i}
                  onClick={() => onPeriodClick(i)}
                  style={{
                    position: "absolute",
                    left: x,
                    top: 0,
                    width: w,
                    height: BAND_H,
                    background: `oklch(0.78 0.07 ${hue} / ${a})`,
                    borderRight: `1px solid oklch(0.78 0.07 ${hue} / 0.35)`,
                    borderBottom: isActive ? `2px solid oklch(0.72 0.14 ${hue})` : undefined,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                      color: `oklch(${isActive ? (dark ? 0.85 : 0.52) : (dark ? 0.72 : 0.40)} 0.12 ${hue})`,
                    }}
                  >
                    {p.label}
                  </span>
                </div>
              );
            })}

          {/* Active event span */}
          {activeEvent && (() => {
            const x1 = xOf(activeEvent.years[0]) - 20;
            const x2 = xOf(activeEvent.years[1]) + 20;
            return (
              <div
                style={{
                  position: "absolute",
                  left: x1,
                  top: BAND_H + 2,
                  width: x2 - x1,
                  height: STRIP_H - BAND_H - 2,
                  background: `${activeEvent.color}18`,
                  borderLeft: `2px solid ${activeEvent.color}66`,
                  borderRight: `2px solid ${activeEvent.color}66`,
                  pointerEvents: "none",
                }}
              />
            );
          })()}

          {/* Active period highlight in axis area */}
          {activePeriodIdx !== null && (() => {
            const p = PERIODS[activePeriodIdx];
            const x1 = xOf(p.start);
            const w = (p.end - p.start) * 76;
            return (
              <div
                style={{
                  position: "absolute",
                  left: x1,
                  top: BAND_H,
                  width: w,
                  height: STRIP_H - BAND_H,
                  background: `oklch(0.78 0.07 ${p.h} / ${dark ? 0.14 : 0.09})`,
                  borderLeft: `1px solid oklch(0.78 0.12 ${p.h} / 0.35)`,
                  borderRight: `1px solid oklch(0.78 0.12 ${p.h} / 0.35)`,
                  pointerEvents: "none",
                }}
              />
            );
          })()}

          {/* Horizontal axis line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: AX_TOP + 18,
              width: TW,
              height: 1,
              background: pal.border,
            }}
          />

          {/* Decade ticks + labels */}
          {DECADES.map((d) => {
            const x = xOf(d);
            return (
              <div key={d}>
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: AX_TOP + 4,
                    width: 1,
                    height: 14,
                    background: pal.textDim,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: x + 3,
                    top: AX_TOP + 3,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: pal.textMid,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {d}
                </span>
                {/* Half-decade tick */}
                <div
                  style={{
                    position: "absolute",
                    left: x + 5 * 76,
                    top: AX_TOP + 8,
                    width: 1,
                    height: 9,
                    background: pal.border,
                  }}
                />
              </div>
            );
          })}

          {/* Video dots */}
          {videos.map((v) => {
            const dimmed = activeEventId && !v.events.includes(activeEventId);
            return (
              <div
                key={v.id}
                title={`${v.year} — ${v.title}`}
                style={{
                  position: "absolute",
                  left: xOf(v.year) - 4,
                  top: AX_TOP + 12,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: dimmed ? pal.border : THEME_COLOR[v.theme],
                  border: `2px solid ${pal.stripBg}`,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              />
            );
          })}

          {/* Legend */}
          <div
            style={{
              position: "absolute",
              left: 140,
              bottom: 16,
              display: "flex",
              gap: 16,
            }}
          >
            {(Object.keys(THEME_COLOR) as Array<keyof typeof THEME_COLOR>).map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: THEME_COLOR[t] }} />
                <span style={{ fontSize: 10, color: pal.textDim, fontWeight: 500 }}>
                  {THEME_LABEL[t]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
