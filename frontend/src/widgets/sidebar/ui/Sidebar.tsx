"use client";

import { THEME_COLOR, THEME_LABEL, THEME_ICON, ACCENT } from "@/shared/config/themes";
import type { Theme } from "@/shared/config/themes";
import type { Palette } from "@/shared/config/palette";

interface Props {
  pal: Palette;
  dark: boolean;
  activeTheme: Theme | null;
  setActiveTheme: (t: Theme | null) => void;
  watched: Set<string>;
  totalVideos: number;
  loggedIn: boolean;
  userImage: string | null;
  userName: string | null;
  onLogin: () => void;
}

export function Sidebar({
  pal,
  dark,
  activeTheme,
  setActiveTheme,
  watched,
  totalVideos,
  loggedIn,
  userImage,
  userName,
  onLogin,
}: Props) {
  const pct = totalVideos > 0 ? watched.size / totalVideos : 0;
  const r = 14;
  const circ = 2 * Math.PI * r;

  return (
    <div
      style={{
        width: 68,
        flexShrink: 0,
        height: "100%",
        background: pal.sidebarBg,
        borderRight: `1px solid ${pal.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0 18px",
        gap: 2,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 7,
          background: ACCENT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
          color: "#fff",
          fontFamily: "var(--font-serif)",
          flexShrink: 0,
          marginBottom: 12,
        }}
      >
        H
      </div>

      <div
        style={{
          fontSize: 8.5,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: pal.textDim,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          marginBottom: 8,
        }}
      >
        XX ВЕК
      </div>

      <div style={{ width: 34, height: 1, background: pal.border, margin: "4px 0 8px" }} />

      {/* All themes */}
      <button
        onClick={() => setActiveTheme(null)}
        title="Все темы"
        style={{
          width: 38,
          height: 34,
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          background: !activeTheme ? pal.text : "transparent",
          color: !activeTheme ? (dark ? "#0a0908" : "#fff") : pal.textDim,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.06em",
          transition: "all 0.15s",
        }}
      >
        ВСЕ
      </button>

      {(Object.keys(THEME_COLOR) as Theme[]).map((t) => {
        const active = activeTheme === t;
        return (
          <button
            key={t}
            onClick={() => setActiveTheme(active ? null : t)}
            title={THEME_LABEL[t]}
            style={{
              width: 38,
              height: 38,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: active ? THEME_COLOR[t] : "transparent",
              color: active ? "#fff" : THEME_COLOR[t],
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {THEME_ICON[t]}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Progress ring */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 34,
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="34" height="34" style={{ position: "absolute" }}>
            <circle cx="17" cy="17" r={r} fill="none" stroke={pal.border} strokeWidth="2.5" />
            <circle
              cx="17" cy="17" r={r}
              fill="none"
              stroke="#2d7d59"
              strokeWidth="2.5"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round"
              transform="rotate(-90 17 17)"
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: pal.textMid, zIndex: 1, fontVariantNumeric: "tabular-nums" }}>
            {watched.size}
          </span>
        </div>
        <span style={{ fontSize: 8, color: pal.textDim, letterSpacing: "0.04em" }}>
          из {totalVideos}
        </span>
      </div>

      <div style={{ width: 34, height: 1, background: pal.border, margin: "2px 0 6px" }} />

      {/* Login button */}
      <button
        onClick={onLogin}
        style={{
          width: 38,
          height: 38,
          borderRadius: 6,
          cursor: "pointer",
          border: `1px solid ${loggedIn ? "#2d7d59" : pal.border}`,
          background: "transparent",
          fontSize: 16,
          color: loggedIn ? "#2d7d59" : pal.textDim,
          transition: "all 0.15s",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loggedIn && userImage ? (
          <img
            src={userImage}
            alt={userName ?? ""}
            style={{ width: 38, height: 38, objectFit: "cover" }}
          />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
