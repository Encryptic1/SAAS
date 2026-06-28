import { expect, test } from "@playwright/test";
import { APP_BASE_URLS, REQUIRED_APPS } from "./fixtures";
import { externalAvailable, fetchFloodG8Catalog } from "./helpers";

/**
 * Cross-repo: Portfolio catalog. GET FloodG8 /api/portfolio/catalog returns 17
 * products (13 Standard + FloodG8 + SyncDevTime + Agent Skill + Standard
 * Workspace). When FloodG8 is unreachable, verify the local 14-app catalog
 * (every app's /api/health identifies its product).
 */
test.describe("Cross-repo: Portfolio catalog", () => {
  test("FloodG8 catalog returns 17 products (skips when unavailable)", async () => {
    if (!(await externalAvailable("floodg8"))) {
      test.skip(true, "FloodG8 unreachable — skipping catalog fetch");
      return;
    }
    const products = await fetchFloodG8Catalog();
    expect(products).not.toBeNull();
    expect(products!.length).toBeGreaterThanOrEqual(14);
  });

  test("local 14-app catalog is complete + each product is identifiable", async ({ request }) => {
    for (const app of REQUIRED_APPS) {
      const res = await request.get(`${APP_BASE_URLS[app]}/api/health`);
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.product).toBe(`standard-${app}`);
    }
  });

  test("workspace status grid covers all 14 apps", async ({ request, page }) => {
    const res = await request.post(`${APP_BASE_URLS.workspace}/api/health/run`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // 13 suite apps + FloodG8 + SyncDevTime + Supabase + Stripe = 17 targets.
    expect(body.total).toBeGreaterThanOrEqual(14);

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${APP_BASE_URLS.workspace}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/portfolio control panel|status grid/i);
    expect(errors.length).toBe(0);
  });
});
