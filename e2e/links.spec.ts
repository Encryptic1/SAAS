import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Links — list + create + redirect", () => {
  test("dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.links}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Links dashboard");
  });

  test("link list renders", async ({ page }) => {
    await page.goto(`${BASE.links}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/link|short|url|click/i);
  });

  test("create link via API", async ({ request }) => {
    const res = await request.post(`${BASE.links}/api/links`, {
      data: {
        name: `E2E ${Date.now()}`,
        stripeUrl: "https://buy.stripe.com/test_e2e_link",
      },
    });
    expect(res.status()).toBeLessThan(400);
  });
});
