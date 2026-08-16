import type { NextConfig } from "next";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8055";
const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    API_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_MEMBER_APP_URL: memberAppUrl,
  },
  async rewrites() {
    if (!apiBaseUrl.startsWith("/")) return [];

    const proxyTarget =
      process.env.API_PROXY_TARGET ?? "http://localhost:8055";

    return [
      {
        source: `${apiBaseUrl}/:path*`,
        destination: `${proxyTarget.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
