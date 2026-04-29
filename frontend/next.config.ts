import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Don't bundle native modules — keep them as real require() calls
  serverExternalPackages: ["better-sqlite3", "bcryptjs"],

  // Allow the dev server to be reached from LAN and ngrok tunnels.
  // Next.js 15+ blocks non-localhost origins by default; add any
  // hostname you'll use below (no protocol/port, wildcards work).
  allowedDevOrigins: [
    "192.168.0.164",      // direct LAN access
    "*.ngrok-free.app",   // free-tier ngrok tunnels
    "*.ngrok.io",         // legacy / paid ngrok domains
  ],
};

export default nextConfig;
