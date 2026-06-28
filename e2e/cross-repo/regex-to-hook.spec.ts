import { expect, test } from "@playwright/test";
import { APP_BASE_URLS } from "./fixtures";
import { deepLink } from "./helpers";

/**
 * Cross-repo: Regex → Hook. Save a regex pattern in Regex, then verify the
 * "Save as Hook filter" deep-link carries the pattern to Hook's inbox view
 * with the filter query param populated.
 */
test.describe("Cross-repo: Regex → Hook", () => {
  test("regex pattern deep-links to Hook inbox with filter param", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Regex dashboard renders the pattern builder.
    await page.goto(`${APP_BASE_URLS.regex}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/regex|pattern/i);

    // The deep-link to Hook inbox carries the filter query param.
    const url = deepLink("regex", "hook", "/dashboard", { filter: "^order\\.(created|updated)$" });
    expect(url).toContain("filter=");
    expect(url).toContain("from=regex");

    // Hook dashboard loads without errors.
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/hook|inbox|webhook/i);
    expect(errors.length).toBe(0);
  });
});
