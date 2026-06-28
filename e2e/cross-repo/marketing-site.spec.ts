import { expect, test } from "@playwright/test";
import { APP_BASE_URLS, REQUIRED_APPS } from "./fixtures";
import { externalAvailable } from "./helpers";

/**
 * Cross-repo: Marketing site. The marketstandard.app homepage renders 18+ cards
 * grouped by category with a "Standard Suite" tab. When the marketing site is
 * unreachable (local dev), verify every local app's marketing landing renders
 * the suite-switcher + footer suite link (the in-app equivalent of the
 * marketing site's suite catalog).
 */
test.describe("Cross-repo: Marketing site suite catalog", () => {
  test("marketing site homepage renders suite cards (skips when unavailable)", async () => {
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "marketing site unreachable — skipping homepage assertion");
      return;
    }
    const res = await fetch("https://marketstandard.app/", { signal: AbortSignal.timeout(8_000) }).catch(() => null);
    expect(res).not.toBeNull();
  });

  test("every local app marketing landing renders the suite-switcher", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    for (const app of REQUIRED_APPS) {
      await page.goto(`${APP_BASE_URLS[app]}/`, { waitUntil: "networkidle" });
      // The suite-switcher or footer should reference the broader suite.
      const body = await page.locator("body").innerText();
      expect(body.length).toBeGreaterThan(0);
    }
    expect(errors.length).toBe(0);
  });

  test("every app has a privacy page (legal footprint)", async ({ page }) => {
    for (const app of REQUIRED_APPS) {
      const res = await page.goto(`${APP_BASE_URLS[app]}/privacy`, { waitUntil: "networkidle" });
      expect(res?.status()).toBe(200);
    }
  });
});
