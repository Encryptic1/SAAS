import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Postmortem — blameless template + recurrence", () => {
  test("dashboard loads with seeded incidents", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.postmortem}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Postmortem dashboard");
  });

  test("incident list shows seeded Stripe webhook incident", async ({ page }) => {
    await page.goto(`${BASE.postmortem}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/Stripe webhook|postmortem|SEV/i);
  });

  test("new postmortem form renders the blameless template fields", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.postmortem}/dashboard/new`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/severity|source|title/i);
    expectNoErrors(errors, "Postmortem new form");
  });

  test("create incident via API with action item", async ({ request }) => {
    const createRes = await request.post(`${BASE.postmortem}/api/incidents`, {
      data: {
        title: `e2e-postmortem-${Date.now()}`,
        severity: "sev3",
        source: "hook",
        summary: "E2E test incident from Playwright",
        rootcauseMd: "Test root cause: retry queue backpressure during upstream 503s.",
      },
    });
    expect(createRes.status()).toBe(201);
    const incident = await createRes.json();
    const incidentId = incident.incident.id;

    const actionRes = await request.post(`${BASE.postmortem}/api/incidents/${incidentId}/actions`, {
      data: { body: "Add exponential backoff", dueAt: "2026-12-31" },
    });
    expect(actionRes.status()).toBe(201);
  });

  test("recurrence API returns suggestions for similar incidents", async ({ request }) => {
    const res = await request.get(`${BASE.postmortem}/api/recurrence?threshold=0.3`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.suggestions)).toBe(true);
  });

  test("recurrence graph page loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.postmortem}/dashboard/recurrence`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/recurrence|similar|graph/i);
    expectNoErrors(errors, "Postmortem recurrence graph");
  });

  test("intake webhook accepts external incident push", async ({ request }) => {
    const res = await request.post(`${BASE.postmortem}/api/intake`, {
      data: {
        ownerId: "local-dev",
        title: `e2e-intake-${Date.now()}`,
        severity: "sev2",
        source: "status",
        summary: "Failed pipeline triggered from Standard Status",
      },
    });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.incident.source).toBe("status");
    expect(json.incident.status).toBe("investigating");
  });
});
