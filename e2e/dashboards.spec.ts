import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Dashboard shells (local dev)", () => {
  test("Proof dashboard overview loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.proof}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Proof dashboard");
  });

  test("Proof collections page loads", async ({ page }) => {
    await page.goto(`${BASE.proof}/dashboard/collections`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(/collection/i);
  });

  test("Proof billing page loads", async ({ page }) => {
    await page.goto(`${BASE.proof}/dashboard/billing`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/plan|billing|upgrade/i);
  });

  test("Metrics dashboard with charts loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/\$|MRR|revenue/i);
    expectNoErrors(errors, "Metrics dashboard");
  });

  test("Metrics payment links page loads", async ({ page }) => {
    await page.goto(`${BASE.metrics}/dashboard/links`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(/link/i);
  });

  test("Polls dashboard overview loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.polls}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Polls dashboard");
  });

  test("Polls standup page loads", async ({ page }) => {
    await page.goto(`${BASE.polls}/dashboard/standup`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/standup|prompt/i);
  });

  test("Polls digest page loads", async ({ page }) => {
    await page.goto(`${BASE.polls}/dashboard/digest`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/digest/i);
  });

  test("Hook dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.hook}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Hook dashboard");
  });

  test("Release dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.release}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Release dashboard");
  });

  test("Vault dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.vault}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Vault dashboard");
  });

  test("Links dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.links}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Links dashboard");
  });

  test("Snippets dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.snippets}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Snippets dashboard");
  });

  test("Status dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.status}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Status dashboard");
  });

  test("Regex dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.regex}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Regex dashboard");
  });

  test("Postmortem dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.postmortem}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    expectNoErrors(errors, "Postmortem dashboard");
  });

  test("Postmortem billing page loads", async ({ page }) => {
    await page.goto(`${BASE.postmortem}/dashboard/billing`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/plan|billing|upgrade/i);
  });

  test("Regex billing page loads", async ({ page }) => {
    await page.goto(`${BASE.regex}/dashboard/billing`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/plan|billing|upgrade/i);
  });
});

test.describe("Public intake", () => {
  test("Proof submit form page loads", async ({ page }) => {
    await page.goto(`${BASE.proof}/submit/demo`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: /submit|send/i })).toBeVisible();
  });
});
