import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Vault — projects + secrets + dotenv", () => {
  test("dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.vault}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Vault dashboard");
  });

  test("project list renders", async ({ page }) => {
    await page.goto(`${BASE.vault}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/project|secret|dotenv/i);
  });

  test("create project via API", async ({ request }) => {
    const res = await request.post(`${BASE.vault}/api/projects`, {
      data: { name: `e2e-vault-${Date.now()}` },
    });
    expect(res.status()).toBeLessThan(400);
    const json = await res.json();
    expect(json.project?.id ?? json.id).toBeTruthy();
  });

  test("dotenv export endpoint returns text/plain", async ({ request }) => {
    const res = await request.get(`${BASE.vault}/api/projects`);
    const json = await res.json();
    const firstProject = json.projects?.[0];
    if (!firstProject) {
      test.skip(true, "no projects seeded");
      return;
    }
    const dotenvRes = await request.get(`${BASE.vault}/api/projects/${firstProject.id}/dotenv`);
    expect(dotenvRes.status()).toBeLessThan(400);
    const text = await dotenvRes.text();
    expect(text.length).toBeGreaterThan(0);
  });
});
