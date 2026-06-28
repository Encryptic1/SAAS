import { expect, test } from "@playwright/test";
import { BASE, gotoNoErrors } from "./helpers";

test("dashboard shows seeded MRR and subscriptions", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.metrics}/dashboard`, "Metrics dashboard");
  await expect(page.locator("body")).toContainText("$12,400");
  await expect(page.locator("body")).toContainText("142");
});

test("dashboard connected query shows local dev message", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.metrics}/dashboard?connected=true`, "Metrics connected");
  await expect(page.locator("body")).toContainText(/seeded PGlite|local dev/i);
});

test("home CTA opens dashboard", async ({ page }) => {
  await page.goto(BASE.metrics, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /Open Demo Dashboard/i }).first().click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("body")).toContainText("$12,400");
});

test("privacy page", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.metrics}/privacy`, "Metrics privacy");
  await expect(page.locator("h1")).toContainText("Privacy Policy");
  await expect(page.locator("body")).toContainText("Data we collect");
});
