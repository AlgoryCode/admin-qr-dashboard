import type { NextConfig } from "next";

const memberAppUrl =
  process.env.NEXT_PUBLIC_MEMBER_APP_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_MEMBER_APP_URL: memberAppUrl,
  },
};

export default nextConfig;
