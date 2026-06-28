import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Lens — query optimizer + slow detection", () => {
  test("dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/query library|saved query/i);
    expectNoErrors(errors, "Lens dashboard");
  });

  test("slow queries page loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard/slow`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/slow quer/i);
    expectNoErrors(errors, "Lens slow queries");
  });

  test("explain page loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard/explain`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/explain|sql query/i);
    expectNoErrors(errors, "Lens explain");
  });

  test("explain API scores a full-scan query", async ({ request }) => {
    const res = await request.post(`${BASE.lens}/api/queries/explain`, {
      data: { sql: "SELECT * FROM orders" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.result.score).toBeLessThan(100);
    expect(json.result.findings.length).toBeGreaterThan(0);
    expect(json.result.plan.length).toBeGreaterThan(0);
    expect(json.result.findings.some((f: { rule: string }) => f.rule === "full-scan")).toBeTruthy();
  });

  test("explain API scores a well-formed query higher", async ({ request }) => {
    const res = await request.post(`${BASE.lens}/api/queries/explain`, {
      data: { sql: "SELECT id, email FROM users WHERE id = $1 LIMIT 1" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.result.score).toBeGreaterThan(50);
  });

  test("queries API can create + list + delete a query", async ({ request }) => {
    const createRes = await request.post(`${BASE.lens}/api/queries`, {
      data: {
        name: `E2E query ${Date.now()}`,
        sqlText: "SELECT id FROM users WHERE created_at > now() - interval '7 days'",
        databaseLabel: "e2e",
        tags: ["e2e"],
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.query.id).toBeTruthy();

    const listRes = await request.get(`${BASE.lens}/api/queries`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.queries.some((q: { id: string }) => q.id === created.query.id)).toBeTruthy();

    const delRes = await request.delete(`${BASE.lens}/api/queries/${created.query.id}`);
    expect(delRes.status()).toBe(200);
  });

  test("slow API records a slow query capture", async ({ request }) => {
    const res = await request.post(`${BASE.lens}/api/slow`, {
      data: {
        queryHash: "e2e_hash_1",
        sqlText: "SELECT * FROM big_table",
        durationMs: 4200,
        thresholdMs: 1000,
        source: "postgres",
        databaseLabel: "e2e",
      },
    });
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.slowQuery.id).toBeTruthy();
    expect(json.slowQuery.durationMs).toBe(4200);
  });
});
