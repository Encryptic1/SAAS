import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@market-standard/ui",
    "@market-standard/db",
    "@market-standard/billing",
    "@market-standard/auth",
  ],
  serverExternalPackages: ["postgres"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
