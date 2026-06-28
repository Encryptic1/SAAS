import type { MetadataRoute } from "next";
import { getPortfolioUrls } from "./portfolio-urls";

export type SuiteProductKey =
  | "polls"
  | "proof"
  | "metrics"
  | "hook"
  | "release"
  | "vault"
  | "links"
  | "snippets"
  | "status"
  | "regex"
  | "postmortem"
  | "lens"
  | "cron"
  | "workspace";

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface BuildSitemapInput {
  product: SuiteProductKey;
  /** Extra paths beyond the canonical marketing routes. */
  extraPaths?: string[];
  /** Override the production origin (defaults to the portfolio URL). */
  origin?: string;
  /** Change frequency hint. */
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

const DEFAULT_PATHS = ["/", "/privacy"];

/**
 * Build a Next.js MetadataRoute.Sitemap for a single suite app. Uses the
 * production portfolio URL as the origin (falling back to NEXT_PUBLIC_APP_URL
 * or the local dev URL).
 */
export function buildSitemap({
  product,
  extraPaths = [],
  origin,
  changeFrequency = "weekly",
  priority = 0.7,
}: BuildSitemapInput): MetadataRoute.Sitemap {
  const urls = getPortfolioUrls();
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? urls[product] ?? `http://localhost:3000`;
  const originUrl = base.replace(/\/$/, "");
  const paths = Array.from(new Set([...DEFAULT_PATHS, ...extraPaths]));
  const now = new Date();
  return paths.map((path) => ({
    url: `${originUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority: path === "/" ? Math.min(1, priority + 0.2) : priority,
  }));
}

interface BuildRobotsInput {
  product: SuiteProductKey;
  /** Disallow paths (e.g. dashboard routes that should not be indexed). */
  disallow?: string[];
  origin?: string;
}

/**
 * Build a Next.js MetadataRoute.Robots for a single suite app. Allows the
 * marketing + privacy pages and disallows authenticated dashboard routes.
 */
export function buildRobots({ product, disallow = ["/dashboard", "/api"], origin }: BuildRobotsInput): MetadataRoute.Robots {
  const urls = getPortfolioUrls();
  const base = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? urls[product] ?? `http://localhost:3000`;
  const originUrl = base.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${originUrl}/sitemap.xml`,
    host: originUrl,
  };
}
