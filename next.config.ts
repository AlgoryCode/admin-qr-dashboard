import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets a second dev server run from this folder (e.g. against another backend).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
