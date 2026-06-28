import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Snippets — create + tag filter + share", () => {
  test("dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.snippets}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Snippets dashboard");
  });

  test("snippet list renders", async ({ page }) => {
    await page.goto(`${BASE.snippets}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/snippet|code|tag/i);
  });

  test("create snippet via API", async ({ request }) => {
    const res = await request.post(`${BASE.snippets}/api/snippets`, {
      data: {
        title: `e2e-snippet-${Date.now()}`,
        language: "typescript",
        body: "const x: number = 42;",
        tags: ["e2e", "demo"],
      },
    });
    expect(res.status()).toBeLessThan(400);
    const json = await res.json();
    const snippet = json.snippet ?? json;
    expect(snippet.id).toBeTruthy();
  });
});
