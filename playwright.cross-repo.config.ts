import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 12: cross-repo integration test config.
 *
 * Runs the 18 cross-repo spec scenarios against the local dev stack (14 apps
 * + gateway) plus external services (FloodG8, SyncDevTime, Stripe, Supabase)
 * when reachable. Specs that depend on unavailable external services skip
 * gracefully. Longer timeout (120s) to accommodate cross-app flows + SSE.
 */
export default defineConfig({
  testDir: "./e2e/cross-repo",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: "list",
  globalSetup: "./e2e/cross-repo/global-setup.ts",
  globalTeardown: "./e2e/cross-repo/global-teardown.ts",
  use: {
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
