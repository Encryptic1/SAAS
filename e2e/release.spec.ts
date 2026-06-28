import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Release — repos + notes", () => {
  test("repos dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.release}/dashboard/repos`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Release repos");
  });

  test("notes dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.release}/dashboard/notes`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/note|release/i);
    expectNoErrors(errors, "Release notes");
  });

  test("connect repo form renders", async ({ page }) => {
    await page.goto(`${BASE.release}/dashboard/repos`, { waitUntil: "networkidle" });
    // The connect-repo-form should have a GitHub URL or repo input
    await expect(page.locator("body")).toContainText(/repo|connect|github/i);
  });
});
