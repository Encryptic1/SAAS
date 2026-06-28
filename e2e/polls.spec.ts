import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors, gotoNoErrors, parsePollsStats } from "./helpers";

test.describe.configure({ mode: "serial" });

test("home shows live stats from gateway", async ({ page }) => {
  await gotoNoErrors(page, BASE.polls, "Polls home");
  const text = await page.locator("body").innerText();
  const stats = parsePollsStats(text);
  expect(stats, "dbHint with workspace/poll counts").not.toBeNull();
  expect(stats!.workspaces).toBeGreaterThanOrEqual(1);
});

test("mock install increases workspace count", async ({ page }) => {
  await page.goto(BASE.polls, { waitUntil: "networkidle" });
  const before = parsePollsStats(await page.locator("body").innerText());

  const res = await page.goto(`${BASE.polls}/api/dev/mock-install`, { waitUntil: "networkidle" });
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/installed=true/);

  await page.goto(BASE.polls, { waitUntil: "networkidle" });
  const after = parsePollsStats(await page.locator("body").innerText());
  expect(after!.workspaces).toBeGreaterThan(before!.workspaces);
});

test("dev form creates poll and updates stats", async ({ page }) => {
  await page.goto(BASE.polls, { waitUntil: "networkidle" });
  const before = parsePollsStats(await page.locator("body").innerText());

  await page.goto(`${BASE.polls}/dev`, { waitUntil: "networkidle" });
  await page.getByLabel("Question").fill(`E2E poll ${Date.now()}?`);
  await page.getByLabel("Options (one per line)").fill("Yes\nNo");
  await page.getByRole("button", { name: "Create poll" }).click();
  await expect(page).toHaveURL(/poll_created=true/, { timeout: 30_000 });

  const after = parsePollsStats(await page.locator("body").innerText());
  expect(after!.polls).toBeGreaterThan(before!.polls);
});

test("installed success banner", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(`${BASE.polls}/?installed=true`, { waitUntil: "networkidle" });
  expectNoErrors(errors, "Polls installed banner");
  await expect(page.locator("body")).toContainText(/installed|stats updated/i);
});

test("poll_created success banner", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto(`${BASE.polls}/?poll_created=true`, { waitUntil: "networkidle" });
  expectNoErrors(errors, "Polls poll_created banner");
  await expect(page.locator("body")).toContainText(/Poll created|stats updated/i);
});

test("privacy page", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.polls}/privacy`, "Polls privacy");
  await expect(page.locator("h1")).toContainText("Privacy Policy");
  await expect(page.getByRole("link", { name: /Back to Standard Polls/i })).toBeVisible();
});
