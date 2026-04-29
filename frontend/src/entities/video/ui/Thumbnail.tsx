"use client";

import { CHANNEL_HUE } from "@/shared/config/themes";

interface Props {
  channel: string;
  thumbnailUrl: string | null;
  height: number;
  duration: string | null;
}

export function Thumbnail({ channel, thumbnailUrl, height, duration }: Props) {
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
      {/* Diagonal stripe fallback (visible only when image absent/loading) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(-45deg,transparent 0,transparent 11px,oklch(0.76 0.06 ${hue}) 11px,oklch(0.76 0.06 ${hue}) 12px)`,
          opacity: 0.45,
        }}
      />
      {/* Real thumbnail — covers the fallback once loaded */}
      {thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, transparent 40%, oklch(0.50 0.08 ${hue}) 100%)`,
        }}
      />
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
            zIndex: 1,
          }}
        >
          {duration}
        </span>
      )}
    </div>
  );
}
