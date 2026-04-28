"use client";

import { CHANNEL_HUE } from "@/shared/config/themes";

interface Props {
  channel: string;
  height: number;
  duration: string | null;
}

export function Thumbnail({ channel, height, duration }: Props) {
  const hue = CHANNEL_HUE[channel] ?? 180;
  return (
    <div
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        background: `oklch(0.86 0.06 ${hue})`,
      }}
    >
      {/* Diagonal stripe */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(-45deg,transparent 0,transparent 11px,oklch(0.76 0.06 ${hue}) 11px,oklch(0.76 0.06 ${hue}) 12px)`,
          opacity: 0.45,
        }}
      />
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 40%, oklch(0.50 0.08 ${hue}) 100%)`,
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          fontSize: 9,
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
        }}
      >
        {channel}
      </span>
      {duration && (
        <span
          style={{
            position: "absolute",
            bottom: 5,
            right: 7,
            background: "rgba(0,0,0,0.68)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 500,
            padding: "1px 5px",
            borderRadius: 2,
          }}
        >
          {duration}
        </span>
      )}
    </div>
  );
}
