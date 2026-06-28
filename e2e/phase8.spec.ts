import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

// Phase 8: auth status pages + notification center + first-run tour.

test.describe("Auth status pages", () => {
  for (const [app, base] of [
    ["polls", BASE.polls],
    ["lens", BASE.lens],
    ["cron", BASE.cron],
  ] as const) {
    test(`${app} /auth/loading renders loading state`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(`${base}/auth/loading`, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toContainText(/verifying your sign-in/i);
      expectNoErrors(errors, `${app} auth loading`);
    });

    test(`${app} /auth/error?reason=expired renders expired copy`, async ({ page }) => {
      const errors = collectPageErrors(page);
      await page.goto(`${base}/auth/error?reason=expired`, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toContainText(/expired/i);
      await expect(page.locator("body")).toContainText(/back to sign in/i);
      expectNoErrors(errors, `${app} auth error`);
    });

    test(`${app} /auth/error falls back to unknown for bad reason`, async ({ page }) => {
      await page.goto(`${base}/auth/error?reason=garbage`, { waitUntil: "networkidle" });
      await expect(page.locator("h1")).toContainText(/didn't complete|sign-in didn't complete/i);
    });
  }
});

test.describe("Notification center", () => {
  // The bell is rendered in both the desktop and mobile topbars (only one is
  // visible per viewport), so pick the one that's actually shown.
  function bellLocator(page: import("@playwright/test").Page) {
    const width = page.viewportSize()?.width ?? 1280;
    const scope = width < 768 ? ".ms-dash-mobile-topbar" : ".ms-dash-topbar";
    return page.locator(`${scope} .ms-notif-bell`).first();
  }

  test("create + list + mark-read via API and bell reflects unread", async ({ page, request }) => {
    // Clean slate: mark everything read for the local-dev owner.
    await request.post(`${BASE.lens}/api/notifications/read-all`);

    // Create a notification through the public API (owner resolved to local-dev).
    const createRes = await request.post(`${BASE.lens}/api/notifications`, {
      data: { title: `E2E notif ${Date.now()}`, body: "from phase 8 spec", level: "info" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.notification.id).toBeTruthy();

    // List reflects it.
    const listRes = await request.get(`${BASE.lens}/api/notifications`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.notifications.some((n: { id: string }) => n.id === created.notification.id)).toBeTruthy();

    // Dashboard bell shows an unread badge.
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard`, { waitUntil: "networkidle" });
    const bell = bellLocator(page);
    await expect(bell).toBeVisible();
    await expect(bell.locator(".ms-notif-badge")).toBeVisible();

    // Open the panel and mark all read; badge disappears.
    await bell.click();
    await expect(page.locator(".ms-notif-panel")).toBeVisible();
    const markAll = page.locator(".ms-notif-markall");
    await expect(markAll).toBeVisible();
    await markAll.click();
    await expect(bell.locator(".ms-notif-badge")).toHaveCount(0);
    expectNoErrors(errors, "Lens notification center");

    // Cleanup via API.
    await request.post(`${BASE.lens}/api/notifications/read-all`);
  });

  test("notification API requires a title", async ({ request }) => {
    const res = await request.post(`${BASE.cron}/api/notifications`, { data: { body: "no title" } });
    expect(res.status()).toBe(400);
  });

  test("mark-read endpoint works", async ({ request }) => {
    const createRes = await request.post(`${BASE.polls}/api/notifications`, {
      data: { title: `Mark read ${Date.now()}` },
    });
    const created = await createRes.json();
    const readRes = await request.patch(`${BASE.polls}/api/notifications/${created.notification.id}/read`);
    expect(readRes.status()).toBe(200);
    const listRes = await request.get(`${BASE.polls}/api/notifications`);
    const list = await listRes.json();
    const item = list.notifications.find((n: { id: string }) => n.id === created.notification.id);
    expect(item.readAt).toBeTruthy();
  });
});

test.describe("First-run tour", () => {
  test("tour renders on dashboard and can be dismissed", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard`, { waitUntil: "networkidle" });
    const tour = page.locator(".ms-tour").first();
    // Tour may have been dismissed by a prior test in this worker; reset storage first.
    await page.evaluate(() => localStorage.removeItem("mktstd:tour-dismissed:standard-lens"));
    await page.reload({ waitUntil: "networkidle" });
    await expect(tour).toBeVisible();
    await expect(tour).toContainText(/getting started/i);
    await page.locator(".ms-tour-dismiss").first().click();
    await expect(tour).toHaveCount(0);
    expectNoErrors(errors, "Lens first-run tour");
  });
});
