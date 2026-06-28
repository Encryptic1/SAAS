/**
 * Phase 12: shared fixtures for cross-repo integration tests.
 *
 * These fixtures provide deterministic test data used across the 18 cross-repo
 * spec scenarios. External-service fixtures (FloodG8 catalog, Stripe customer,
 * Supabase rows) are seeded lazily by the helpers when the corresponding
 * service is reachable; otherwise specs that depend on them skip.
 */

export const TEST_USER = {
  id: "local-dev",
  email: "local-dev@marketstandard.app",
  displayName: "Local Dev",
} as const;

export const TEST_SLACK_CHANNEL = {
  name: "#e2e-cross-repo",
  webhookUrl: process.env.E2E_SLACK_WEBHOOK_URL ?? "",
} as const;

export const TEST_STRIPE_CUSTOMER = {
  email: "e2e-customer@marketstandard.app",
  description: "E2E cross-repo test customer",
} as const;

export const TEST_SUPABASE_TABLES = {
  pulseEvents: "shared.pulse_events",
  billingCustomers: "shared.billing_customers",
} as const;

/** Apps that must be reachable for the cross-repo suite to run. */
export const REQUIRED_APPS = [
  "polls",
  "proof",
  "metrics",
  "hook",
  "release",
  "vault",
  "links",
  "snippets",
  "status",
  "regex",
  "postmortem",
  "lens",
  "cron",
  "workspace",
] as const;

/** External services that are optional (specs skip if unreachable). */
export const EXTERNAL_SERVICES = [
  "floodg8",
  "syncdevtime",
  "slack",
  "vercel",
  "github",
] as const;

export type ExternalService = (typeof EXTERNAL_SERVICES)[number];

export const APP_BASE_URLS: Record<string, string> = {
  polls: "http://localhost:3001",
  proof: "http://localhost:3002",
  metrics: "http://localhost:3003",
  hook: "http://localhost:3004",
  release: "http://localhost:3005",
  vault: "http://localhost:3006",
  links: "http://localhost:3007",
  snippets: "http://localhost:3008",
  status: "http://localhost:3009",
  regex: "http://localhost:3010",
  postmortem: "http://localhost:3011",
  lens: "http://localhost:3012",
  cron: "http://localhost:3013",
  workspace: "http://localhost:3014",
  gateway: "http://127.0.0.1:4000",
  floodg8: process.env.NEXT_PUBLIC_FLOODG8_URL ?? "https://floodg8.com",
  syncdevtime: process.env.NEXT_PUBLIC_SYNCDEVTIME_URL ?? "https://syncdevtime.com",
};
