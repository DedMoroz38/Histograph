"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PAL } from "@/shared/config/palette";
import { EVENTS } from "@/entities/event/model/events";
import { xOf, PERIODS } from "@/shared/config/timeline";
import { PeriodHeroBanner } from "@/widgets/timeline-canvas/ui/PeriodHeroBanner";
import { PeriodMiniTimeline } from "@/widgets/timeline-canvas/ui/PeriodMiniTimeline";
import { VideoGridView } from "@/widgets/timeline-canvas/ui/VideoGridView";
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
  initialUserId: string | null;
  initialUserImage: string | null;
  initialUserName: string | null;
}

export function TimelinePage({ initialVideos, initialUserEmail, initialUserId, initialUserImage, initialUserName }: Props) {
  const [colorTheme] = useState<"light" | "dark">("light");
  const density = "comfortable" as const;
  const showPeriodBands = true;
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [activeEventId, setActiveEventId] = useState<EventId | null>(null);
  const [activePeriodIdx, setActivePeriodIdx] = useState<number | null>(null);
  const [showListView, setShowListView] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>("year");
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [userImage, setUserImage] = useState<string | null>(initialUserImage);
  const [userName, setUserName] = useState<string | null>(initialUserName);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  // Sync watched state with DB (logged-in) or localStorage (guest).
  // On userId change (login/logout), merge localStorage → DB then re-fetch.
  useEffect(() => {
    if (userId) {
      const raw = localStorage.getItem("hg_watched");
      const localIds: string[] = raw ? (() => { try { return JSON.parse(raw); } catch { return []; } })() : [];

      const loadFromDb = () =>
        fetch("/api/watched")
          .then((r) => r.json())
          .then(({ ids }: { ids: string[] }) => setWatched(new Set(ids)))
          .catch(() => {});

      if (localIds.length > 0) {
        fetch("/api/watched/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: localIds }),
        })
          .then(() => { localStorage.removeItem("hg_watched"); return loadFromDb(); })
          .catch(() => { loadFromDb(); });
      } else {
        loadFromDb();
      }
    } else {
      const raw = localStorage.getItem("hg_watched");
      if (raw) {
        try { setWatched(new Set(JSON.parse(raw))); } catch { /* ignore */ }
      } else {
        setWatched(new Set());
      }
    }
  }, [userId]);

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
      const removing = n.has(id);
      removing ? n.delete(id) : n.add(id);
      const action = removing ? "remove" : "add";

      if (userId) {
        fetch("/api/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: id, action }),
        }).catch(() => {});
      } else {
        try {
          localStorage.setItem("hg_watched", JSON.stringify([...n]));
        } catch { /* storage full or unavailable */ }
      }
      return n;
    });
  };

  const jumpToEvent = useCallback((ev: HistoricEvent | { years: [number, number] }) => {
    const targetX = Math.max(0, xOf(ev.years[0]) - 120);
    if (canvasRef.current) canvasRef.current.scrollLeft = targetX;
    if (stripRef.current) stripRef.current.scrollLeft = targetX;
  }, []);

  const handlePeriodClick = useCallback((idx: number) => {
    if (activePeriodIdx === idx) {
      setActivePeriodIdx(null);
    } else {
      setActivePeriodIdx(idx);
      const targetX = Math.max(0, xOf(PERIODS[idx].start) - 120);
      if (canvasRef.current) canvasRef.current.scrollLeft = targetX;
      if (stripRef.current) stripRef.current.scrollLeft = targetX;
    }
  }, [activePeriodIdx]);

  const visibleVideos = activePeriodIdx !== null
    ? initialVideos.filter((v) => {
        const p = PERIODS[activePeriodIdx];
        return v.year >= p.start && v.year <= p.end;
      })
    : initialVideos;

  const filteredCount = (() => {
    let base = visibleVideos;
    if (activeEventId) base = base.filter((v) => v.events.includes(activeEventId));
    return base.length;
  })();

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
        loggedIn={!!userId}
        userImage={userImage}
        userName={userName}
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

        {activePeriodIdx !== null && (
          <PeriodHeroBanner
            period={PERIODS[activePeriodIdx]}
            onClose={() => { setActivePeriodIdx(null); setShowListView(false); }}
          />
        )}

        {showListView ? (
          <VideoGridView
            videos={visibleVideos}
            pal={pal}
            watched={watched}
            onToggleWatch={toggleWatch}
            onSelect={setSelectedVideo}
          />
        ) : activePeriodIdx !== null ? (
          <PeriodMiniTimeline
            period={PERIODS[activePeriodIdx]}
            videos={visibleVideos}
            pal={pal}
            density={density}
            watched={watched}
            onToggleWatch={toggleWatch}
            onSelect={setSelectedVideo}
          />
        ) : (
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
            videos={visibleVideos}
          />
        )}

        <TimelineStrip
          scrollRef={stripRef}
          onScroll={handleStripScroll}
          pal={pal}
          dark={dark}
          showPeriodBands={showPeriodBands}
          activeEventId={activeEventId}
          activePeriodIdx={activePeriodIdx}
          onPeriodClick={handlePeriodClick}
          videos={visibleVideos}
        />
      </div>

      {showLoginModal && (
        <LoginModal
          pal={pal}
          dark={dark}
          userEmail={userEmail}
          onClose={() => setShowLoginModal(false)}
          onAuthChange={(email, uid, image, name) => {
            setUserEmail(email);
            setUserId(uid ?? null);
            setUserImage(image ?? null);
            setUserName(name ?? null);
          }}
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

      {/* Список floating button */}
      <button
        onClick={() => setShowListView((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 901,
          height: 36,
          padding: "0 16px",
          borderRadius: 18,
          background: showListView ? pal.text : "#c84b31",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
          letterSpacing: "0.06em",
          fontFamily: "var(--font-sans)",
          transition: "background 0.15s",
        }}
      >
        {showListView ? "× Закрыть" : "≡ Список"}
      </button>
    </div>
  );
}
