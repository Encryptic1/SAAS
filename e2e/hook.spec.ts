import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Hook — inbox + capture + replay", () => {
  test("inboxes dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.hook}/dashboard/inboxes`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Hook inboxes");
  });

  test("create inbox via API then capture an event", async ({ request }) => {
    // 1. Create an inbox
    const createRes = await request.post(`${BASE.hook}/api/inboxes`, {
      data: { name: `e2e-hook-${Date.now()}` },
    });
    expect(createRes.status()).toBeLessThan(400);
    const inbox = await createRes.json();
    const slug = inbox.inbox?.slug ?? inbox.slug;
    expect(slug).toBeTruthy();

    // 2. POST an event to the capture endpoint
    const captureRes = await request.post(`${BASE.hook}/api/capture/${slug}`, {
      data: { event: "order.created", payload: { id: "ord_123", total: 4900 } },
      headers: { "content-type": "application/json" },
    });
    expect(captureRes.status()).toBeLessThan(400);
  });

  test("event list page loads for an inbox", async ({ page, request }) => {
    const res = await request.get(`${BASE.hook}/api/inboxes`);
    const json = await res.json();
    const firstInbox = json.inboxes?.[0];
    if (!firstInbox) {
      test.skip(true, "no inboxes seeded");
      return;
    }
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.hook}/dashboard/inboxes/${firstInbox.id}`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/event|inbox|capture/i);
    expectNoErrors(errors, "Hook event list");
  });
});
