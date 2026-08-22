import type { NextConfig } from "next";

const configuredApiBase = process.env.API_BASE_URL ?? "/api";
const isRelativeApiBase = configuredApiBase.startsWith("/");
const apiBaseUrl = isRelativeApiBase ? configuredApiBase.replace(/\/$/, "") || "/api" : "/api";
const proxyTarget = (
  process.env.API_PROXY_TARGET ??
  (isRelativeApiBase ? "http://localhost:8055" : configuredApiBase)
).replace(/\/$/, "");
const memberAppUrl = process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    API_BASE_URL: apiBaseUrl,
    NEXT_PUBLIC_MEMBER_APP_URL: memberAppUrl,
  },
  async rewrites() {
    return [
      {
        source: `${apiBaseUrl}/:path*`,
        destination: `${proxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
