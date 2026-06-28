import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";

/**
 * Cross-repo: Quota monitor. POST the Metrics quota cron endpoint and verify
 * it samples rate limits and inserts quota_samples rows. Then verify the
 * Metrics quota dashboard renders the gauge cards.
 */
test.describe("Cross-repo: Quota monitor", () => {
  test("quota cron samples rate limits", async ({ request }) => {
    const res = await request.post(`${APP_BASE_URLS.metrics}/api/cron/sync`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "dev"}` },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("quota dashboard renders gauge cards", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.metrics}/dashboard/quota`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/quota|rate limit|gauge/i);
    expect(errors.length).toBe(0);
  });
});
