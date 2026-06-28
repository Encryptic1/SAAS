import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Regex — test + explanation + library", () => {
  test("dashboard loads with seeded patterns", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.regex}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Regex dashboard");
  });

  test("cheat sheet page renders", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.regex}/dashboard/cheat-sheet`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/anchor|quantifier|character class/i);
    expectNoErrors(errors, "Regex cheat sheet");
  });

  test("live test API returns matches + explanation", async ({ request }) => {
    const res = await request.post(`${BASE.regex}/api/patterns/test`, {
      data: {
        pattern: "\\d{4}-\\d{2}-\\d{2}",
        flags: "g",
        input: "Dates: 2026-06-27 and 2026-07-01",
        testCases: [
          { input: "2026-06-27", expectedMatches: 1 },
          { input: "no dates here", expectedMatches: 0 },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.matches.length).toBeGreaterThanOrEqual(2);
    expect(json.explanation.length).toBeGreaterThan(0);
    expect(json.testResults.length).toBe(2);
  });

  test("patterns API returns seeded library", async ({ request }) => {
    const res = await request.get(`${BASE.regex}/api/patterns`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.patterns.length).toBeGreaterThanOrEqual(1);
  });

  test("new pattern editor page loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.regex}/dashboard/new`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/regex|pattern|test|explanation/i);
    expectNoErrors(errors, "Regex new pattern");
  });
});
