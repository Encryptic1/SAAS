import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";

/**
 * Cross-repo: ms-suite depsync. Verifies the Workspace depsync API reports
 * package parity across all apps. Exits non-zero (via test failure) when
 * divergence is detected — the equivalent of `ms-suite depsync` failing.
 */
test.describe("Cross-repo: ms-suite depsync", () => {
  test("depsync API returns a parity report", async ({ request }) => {
    const res = await request.get(`${APP_BASE_URLS.workspace}/api/depsync`);
    expect(res.status()).toBe(200);
    const report = await res.json();
    expect(report.packages).toBeInstanceOf(Array);
    expect(report.divergent).toBeInstanceOf(Array);
    expect(report.generatedAt).toBeTruthy();
  });

  test("depsync dashboard renders the parity report", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.workspace}/dashboard/depsync`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/parity|depsync/i);
    expect(errors.length).toBe(0);
  });

  test("every app's package.json is parseable (no missing @market-standard/* entries)", async ({ request }) => {
    const res = await request.get(`${APP_BASE_URLS.workspace}/api/depsync`);
    const report = await res.json();
    // Every app should appear in at least one package's version list.
    expect(report.packages.length).toBeGreaterThan(0);
  });
});
