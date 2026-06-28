import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Status — pipelines + incidents", () => {
  test("dashboard loads with seeded pipelines", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.status}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Status dashboard");
  });

  test("pipeline list renders", async ({ page }) => {
    await page.goto(`${BASE.status}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/pipeline|deploy|incident/i);
  });

  test("intake webhook accepts a deployment event", async ({ request }) => {
    const res = await request.post(`${BASE.status}/api/intake`, {
      data: {
        source: "github",
        event: "pipeline",
        ownerId: "local-dev",
        pipelineName: "demo-api",
        status: "success",
        sha: "abc1234",
      },
    });
    expect(res.status()).toBeLessThan(400);
  });

  test("incidents API returns list", async ({ request }) => {
    const res = await request.get(`${BASE.status}/api/incidents`);
    expect(res.status()).toBeLessThan(400);
    const json = await res.json();
    expect(Array.isArray(json.incidents) || Array.isArray(json)).toBe(true);
  });
});
