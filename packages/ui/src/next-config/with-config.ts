import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Shared Next.js config wrapper for the Market Standard suite.
 *
 * Applies:
 *  - @next/bundle-analyzer (active when ANALYZE=true) for bundle inspection
 *  - transpilation of the internal workspace packages
 *  - postgres as a server external package
 *  - allowed dev origins for local tunnelling
 *
 * Apps pass their base config and any extra wrappers:
 *
 *   export default withMktStdConfig({ ... })
 *
 * To inspect a bundle: `ANALYZE=true pnpm build` then open the generated
 * .next/analyze/*.html report.
 */
export function withMktStdConfig(base: NextConfig = {}): NextConfig {
  const merged: NextConfig = {
    transpilePackages: [
      "@market-standard/ui",
      "@market-standard/db",
      "@market-standard/billing",
      "@market-standard/auth",
    ],
    serverExternalPackages: ["postgres"],
    allowedDevOrigins: ["127.0.0.1", "localhost"],
    ...base,
  };
  return withBundleAnalyzer(merged) as NextConfig;
}
