import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is fully client-side, so it ships as static files (no Next.js server in production).
  // Security headers live in vercel.json because static exports ignore `headers()` here.
  output: "export",
};

export default nextConfig;
