"use client";

import { Analytics } from "@vercel/analytics/react";

/**
 * Vercel Analytics wrapper for the Market Standard suite.
 *
 * `@vercel/analytics` automatically no-ops on non-Vercel environments (e.g.
 * local dev, other hosts), so it is safe to mount unconditionally. On Vercel
 * it reports page views + Web Vitals to the project's Analytics dashboard.
 *
 * If `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` is set, pass it through to target a
 * specific analytics namespace.
 */
export function MarketAnalytics() {
  const id = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID;
  return <Analytics mode="auto" {...(id ? { id } : {})} />;
}
