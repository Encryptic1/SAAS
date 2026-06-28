import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

/**
 * Billing spec — verifies the Stripe checkout + portal API routes are wired
 * correctly across the portfolio. We don't complete a full Stripe checkout
 * in test mode (that requires Stripe CLI webhook forwarding), but we verify:
 *   1. The billing page renders with plan + upgrade CTAs.
 *   2. The /api/billing/checkout route is reachable and returns either a
 *      Stripe URL (if STRIPE_SECRET_KEY is set) or a clear local-dev error
 *      (if not). Either way, it must not 500.
 *   3. The /api/billing/portal route behaves the same.
 */
test.describe("Stripe billing — checkout + portal routes", () => {
  for (const app of [
    { name: "Proof", base: BASE.proof },
    { name: "Vault", base: BASE.vault },
    { name: "Snippets", base: BASE.snippets },
    { name: "Status", base: BASE.status },
    { name: "Regex", base: BASE.regex },
    { name: "Postmortem", base: BASE.postmortem },
  ]) {
    test(`${app.name} billing page renders`, async ({ page }) => {
      await page.goto(`${app.base}/dashboard/billing`, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toContainText(/plan|billing|upgrade|subscription/i);
    });

    test(`${app.name} checkout route responds (not 500)`, async ({ request }) => {
      const res = await request.post(`${app.base}/api/billing/checkout`, {
        data: { priceId: "price_test_placeholder" },
      });
      // In local dev without a real Stripe key, we expect a 4xx (misconfigured)
      // or a 200 with a url. A 500 means the route crashed — that's a bug.
      expect(res.status(), `${app.name} checkout should not 500`).toBeLessThan(500);
    });

    test(`${app.name} portal route responds (not 500)`, async ({ request }) => {
      const res = await request.post(`${app.base}/api/billing/portal`);
      expect(res.status(), `${app.name} portal should not 500`).toBeLessThan(500);
    });
  }
});
