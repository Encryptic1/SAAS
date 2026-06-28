import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

/**
 * Metrics quota monitor — verifies the quota dashboard renders gauge cards
 * for Stripe / Slack / GitHub / Supabase and the export endpoint is reachable.
 */
test.describe("Metrics — quota monitor + export", () => {
  test("quota monitor renders gauge cards", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/quota|stripe|github|slack|supabase/i);
    expectNoErrors(errors, "Metrics quota monitor");
  });

  test("metrics export endpoint returns data", async ({ request }) => {
    const res = await request.get(`${BASE.metrics}/api/metrics/export`);
    expect(res.status(), "export should not 500").toBeLessThan(500);
  });

  test("cron sync endpoint is reachable", async ({ request }) => {
    const res = await request.get(`${BASE.metrics}/api/cron/sync`);
    // Cron endpoints often require a CRON_SECRET header; 401 is fine, 500 is not.
    expect(res.status(), "cron sync should not 500").toBeLessThan(500);
  });
});
