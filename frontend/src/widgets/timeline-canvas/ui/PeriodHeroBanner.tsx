"use client";

import { PERIODS } from "@/shared/config/timeline";

type Period = (typeof PERIODS)[number];

interface Props {
  period: Period;
  onClose: () => void;
}

export function PeriodHeroBanner({ period, onClose }: Props) {
  const { label, start, end, h, description } = period;

  return (
    <div
      style={{
        height: 200,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: `oklch(0.22 0.10 ${h})`,
      }}
    >
      {/* Diagonal stripe texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(-45deg,transparent 0,transparent 18px,oklch(0.32 0.08 ${h}) 18px,oklch(0.32 0.08 ${h}) 19px)`,
          opacity: 0.45,
        }}
      />
      {/* Dark left vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to right, oklch(0.12 0.12 ${h}) 0%, oklch(0.20 0.10 ${h} / 0.55) 55%, transparent 100%)`,
        }}
      />
      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 25%, oklch(0.10 0.12 ${h} / 0.65) 100%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 32px 24px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: `oklch(0.82 0.16 ${h})`,
            marginBottom: 5,
            fontFamily: "var(--font-sans)",
          }}
        >
          {start}–{end}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            fontFamily: "var(--font-serif)",
            color: "#ffffff",
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.68)",
            fontStyle: "italic",
            maxWidth: 540,
            lineHeight: 1.55,
            fontFamily: "var(--font-sans)",
          }}
        >
          {description}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.38)",
          border: "1px solid rgba(255,255,255,0.22)",
          color: "rgba(255,255,255,0.82)",
          fontSize: 16,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          fontFamily: "var(--font-sans)",
        }}
      >
        ×
      </button>
    </div>
  );
}
