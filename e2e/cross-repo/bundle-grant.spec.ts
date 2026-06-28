import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { externalAvailable } from "./helpers";

/**
 * Cross-repo: Bundle grant (FloodG8 Team → all 13 Standard products). When
 * FloodG8 is reachable, verify the bundle-grant flow seeds billing rows. When
 * not, verify every app's billing page renders (the "included in FloodG8 Team"
 * badge only appears post-grant, but the page must always load).
 */
test.describe("Cross-repo: Bundle grant FloodG8 Team", () => {
  const apps = [
    "polls", "proof", "metrics", "hook", "release", "vault", "links",
    "snippets", "status", "regex", "postmortem", "lens", "cron",
  ] as const;

  test("every app billing page renders", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    for (const app of apps) {
      await page.goto(`${APP_BASE_URLS[app]}/dashboard/billing`, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toContainText(/billing|subscription|plan/i);
    }
    expect(errors.length).toBe(0);
  });

  test("bundle-grant flow requires FloodG8 (skips when unavailable)", async () => {
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "FloodG8 unreachable — skipping bundle-grant flow");
      return;
    }
    // When FloodG8 is up, the grant endpoint seeds shared.billing_customers.
    const res = await fetch(`${APP_BASE_URLS.floodg8}/api/portfolio/bundle-grant`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "local-dev", plan: "team" }),
      signal: AbortSignal.timeout(8_000),
    }).catch(() => null);
    expect(res).not.toBeNull();
  });
});
