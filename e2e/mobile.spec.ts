import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

const MOBILE_VIEWPORT = { width: 375, height: 800 } as const;

test.describe("Mobile responsive dashboards (375px)", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("Polls dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.polls}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    // The page should not horizontally overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Polls mobile should not overflow 375px").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Polls mobile");
  });

  test("Metrics dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Metrics mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Metrics mobile");
  });

  test("Hook dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.hook}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Hook mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Hook mobile");
  });

  test("Status dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.status}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Status mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Status mobile");
  });

  test("Postmortem dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.postmortem}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Postmortem mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Postmortem mobile");
  });

  test("Regex dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.regex}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Regex mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Regex mobile");
  });

  test("Snippets dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.snippets}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Snippets mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Snippets mobile");
  });

  test("Vault dashboard is usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.vault}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Vault mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Vault mobile");
  });

  test("Marketing pages are usable at 375px", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.polls}/`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth, "Polls marketing mobile should not overflow").toBeLessThanOrEqual(400);
    expectNoErrors(errors, "Polls marketing mobile");
  });
});
