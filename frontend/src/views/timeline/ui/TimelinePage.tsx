"use client";

import { useState, useRef, useCallback } from "react";
import { PAL } from "@/shared/config/palette";
import { EVENTS } from "@/entities/event/model/events";
import { xOf } from "@/shared/config/timeline";
import { Header } from "@/widgets/header/ui/Header";
import { Sidebar } from "@/widgets/sidebar/ui/Sidebar";
import { TimelineCanvas } from "@/widgets/timeline-canvas/ui/TimelineCanvas";
import { TimelineStrip } from "@/widgets/timeline-strip/ui/TimelineStrip";
import { VideoModal } from "@/entities/video/ui/VideoModal";
import { LoginModal } from "@/features/auth/ui/LoginModal";
import type { Video } from "@/entities/video/model/types";
import type { Theme } from "@/shared/config/themes";
import type { EventId, HistoricEvent } from "@/entities/event/model/events";
import type { SortMode } from "@/features/sort/ui/SortBar";

interface Props {
  initialVideos: Video[];
  initialUserEmail: string | null;
}

export function TimelinePage({ initialVideos, initialUserEmail }: Props) {
  const [colorTheme, setColorTheme] = useState<"light" | "dark">("light");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [showPeriodBands, setShowPeriodBands] = useState(true);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [activeEventId, setActiveEventId] = useState<EventId | null>(null);
  const [sortBy, setSortBy] = useState<SortMode>("year");
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const pal = PAL[colorTheme];
  const dark = colorTheme === "dark";

  const handleCanvasScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    const sl = canvasRef.current?.scrollLeft ?? 0;
    if (stripRef.current) stripRef.current.scrollLeft = sl;
    setTimeout(() => { syncing.current = false; }, 16);
  }, []);

  const handleStripScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    const sl = stripRef.current?.scrollLeft ?? 0;
    if (canvasRef.current) canvasRef.current.scrollLeft = sl;
    setTimeout(() => { syncing.current = false; }, 16);
  }, []);

  const toggleWatch = (id: string) => {
    setWatched((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const jumpToEvent = useCallback((ev: HistoricEvent | { years: [number, number] }) => {
    const targetX = Math.max(0, xOf(ev.years[0]) - 120);
    if (canvasRef.current) canvasRef.current.scrollLeft = targetX;
    if (stripRef.current) stripRef.current.scrollLeft = targetX;
  }, []);

  const filteredCount = activeEventId
    ? initialVideos.filter((v) => v.events.includes(activeEventId)).length
    : initialVideos.length;

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: pal.bg,
        color: pal.text,
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
      }}
    >
      <Sidebar
        pal={pal}
        dark={dark}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        watched={watched}
        totalVideos={initialVideos.length}
        loggedIn={!!userEmail}
        onLogin={() => setShowLoginModal(true)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Header
          pal={pal}
          allVideos={initialVideos}
          events={EVENTS}
          sortBy={sortBy}
          setSortBy={setSortBy}
          filteredCount={filteredCount}
          totalCount={initialVideos.length}
          onSelectVideo={setSelectedVideo}
          onJumpToEvent={jumpToEvent}
          onSetEventFilter={setActiveEventId}
        />

        {/* Event chips bar */}
        <div
          className="chip-scroll"
          style={{
            height: 38,
            flexShrink: 0,
            borderBottom: `1px solid ${pal.border}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 20,
            gap: 6,
            overflowX: "auto",
            overflowY: "hidden",
            background: pal.bg,
          }}
        >
          {[{ id: null as EventId | null, label: "Все события" as string, color: pal.textDim }, ...EVENTS].map((ev) => {
            const active = activeEventId === ev.id;
            const count = ev.id
              ? initialVideos.filter((v) => v.events.includes(ev.id!)).length
              : initialVideos.length;
            const color = ev.id ? (ev as HistoricEvent).color : pal.textDim;
            return (
              <button
                key={String(ev.id)}
                onClick={() => {
                  if (ev.id && ev.id !== activeEventId) {
                    const found = EVENTS.find((e) => e.id === ev.id);
                    if (found) jumpToEvent(found);
                  }
                  setActiveEventId(active ? null : ev.id);
                }}
                style={{
                  height: 24,
                  padding: "0 10px",
                  borderRadius: 12,
                  flexShrink: 0,
                  border: `1.5px solid ${active ? color : pal.border}`,
                  background: active ? `${color}18` : "transparent",
                  color: active ? color : pal.textDim,
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.14s",
                  whiteSpace: "nowrap",
                }}
              >
                {ev.id && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                )}
                {ev.label}
                <span style={{ fontSize: 10, opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>

        <TimelineCanvas
          scrollRef={canvasRef}
          onScroll={handleCanvasScroll}
          pal={pal}
          activeTheme={activeTheme}
          activeEventId={activeEventId}
          watched={watched}
          onToggleWatch={toggleWatch}
          onSelect={setSelectedVideo}
          density={density}
          sortBy={sortBy}
          videos={initialVideos}
        />

        <TimelineStrip
          scrollRef={stripRef}
          onScroll={handleStripScroll}
          pal={pal}
          dark={dark}
          showPeriodBands={showPeriodBands}
          activeEventId={activeEventId}
          videos={initialVideos}
        />
      </div>

      {showLoginModal && (
        <LoginModal
          pal={pal}
          dark={dark}
          userEmail={userEmail}
          onClose={() => setShowLoginModal(false)}
          onAuthChange={setUserEmail}
        />
      )}

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          pal={pal}
          watched={watched}
          allVideos={initialVideos}
          onClose={() => setSelectedVideo(null)}
          onToggleWatch={toggleWatch}
          onSetEventFilter={setActiveEventId}
          onJumpToEvent={jumpToEvent}
        />
      )}

      {/* Tweaks panel */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 900,
          background: dark ? "#1c1a17" : "#ffffff",
          border: "1px solid rgba(128,128,128,0.18)",
          borderRadius: 8,
          padding: "16px 16px 12px",
          minWidth: 210,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c84b31", marginBottom: 16 }}>
          Tweaks
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "#aaa" : "#555", marginBottom: 7 }}>
          Тема оформления
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["light", "dark"] as const).map((t) => (
            <button key={t} onClick={() => setColorTheme(t)}
              style={{ flex: 1, height: 29, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${colorTheme === t ? "#c84b31" : "rgba(128,128,128,0.22)"}`,
                background: colorTheme === t ? "#c84b3118" : "transparent",
                color: colorTheme === t ? "#c84b31" : (dark ? "#aaa" : "#666"),
                fontSize: 11, fontWeight: 600, transition: "all 0.12s" }}>
              {t === "light" ? "Светлая" : "Тёмная"}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "#aaa" : "#555", marginBottom: 7 }}>
          Плотность
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["comfortable", "compact"] as const).map((d) => (
            <button key={d} onClick={() => setDensity(d)}
              style={{ flex: 1, height: 29, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${density === d ? "#c84b31" : "rgba(128,128,128,0.22)"}`,
                background: density === d ? "#c84b3118" : "transparent",
                color: density === d ? "#c84b31" : (dark ? "#aaa" : "#666"),
                fontSize: 11, fontWeight: 600, transition: "all 0.12s" }}>
              {d === "comfortable" ? "Просторно" : "Компактно"}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? "#aaa" : "#555", marginBottom: 7 }}>
          Периоды
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {([true, false] as const).map((v) => (
            <button key={String(v)} onClick={() => setShowPeriodBands(v)}
              style={{ flex: 1, height: 29, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${showPeriodBands === v ? "#c84b31" : "rgba(128,128,128,0.22)"}`,
                background: showPeriodBands === v ? "#c84b3118" : "transparent",
                color: showPeriodBands === v ? "#c84b31" : (dark ? "#aaa" : "#666"),
                fontSize: 11, fontWeight: 600, transition: "all 0.12s" }}>
              {v ? "Показать" : "Скрыть"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
