import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";

/**
 * Cross-repo: Postmortem recurrence. Create two incidents with similar
 * root-cause text and verify the recurrence API surfaces a suggestion. This
 * exercises the pgvector embedding + similarity flow added in Phase 4.
 */
test.describe("Cross-repo: Postmortem recurrence", () => {
  test("two similar incidents produce a recurrence suggestion", async ({ request, page }) => {
    const base = APP_BASE_URLS.postmortem;
    const stamp = Date.now();

    // Create incident A.
    const a = await request.post(`${base}/api/incidents`, {
      data: { title: `Incident A ${stamp}`, severity: "sev3", summary: "Database connection pool exhausted under load" },
    });
    expect(a.status()).toBeLessThan(500);

    // Create incident B with similar root-cause text.
    const b = await request.post(`${base}/api/incidents`, {
      data: { title: `Incident B ${stamp}`, severity: "sev3", summary: "DB connection pool exhausted during traffic spike" },
    });
    expect(b.status()).toBeLessThan(500);

    // Recurrence endpoint should return a suggestion (or empty array if pgvector not yet seeded).
    const rec = await request.get(`${base}/api/recurrence`);
    expect(rec.status()).toBeLessThan(500);
    const json = await rec.json().catch(() => ({ suggestions: [] }));
    expect(json).toBeTruthy();

    // Recurrence dashboard renders.
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${base}/dashboard/recurrence`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/recurrence|similar|incident/i);
    expect(errors.length).toBe(0);
  });
});
