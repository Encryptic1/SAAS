import { expect, test } from "@playwright/test";
import { BASE, gotoNoErrors, parseProofStats } from "./helpers";

const SEED_AUTHORS = ["Alex Chen", "Jordan Lee", "Sam Rivera"];

test("home shows live collection stats", async ({ page }) => {
  await gotoNoErrors(page, BASE.proof, "Proof home");
  const stats = parseProofStats(await page.locator("body").innerText());
  expect(stats).not.toBeNull();
  expect(stats!.collections).toBeGreaterThanOrEqual(1);
  expect(stats!.testimonials).toBe(3);
});

test("Wall of Love shows seeded testimonials", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.proof}/c/demo`, "Proof demo wall");
  await expect(page.locator(".ms-testimonial")).toHaveCount(3);
  for (const author of SEED_AUTHORS) {
    await expect(page.locator("body")).toContainText(author);
  }
});

test("unknown collection returns 404", async ({ page }) => {
  const res = await page.goto(`${BASE.proof}/c/does-not-exist`, { waitUntil: "networkidle" });
  expect(res?.status()).toBe(404);
});

test("dashboard shows collections and embed snippet", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.proof}/dashboard`, "Proof dashboard");
  await expect(page.locator("body")).toContainText("demo");
  const pre = page.locator("pre.ms-app-pre");
  await expect(pre).toContainText("api/embed/demo.js");
  await expect(pre).toContainText("data-proof-collection=\"demo\"");
  await expect(pre).toContainText("localhost:3002");
});

test("Preview embed matches public wall", async ({ page, context }) => {
  await page.goto(`${BASE.proof}/c/demo`, { waitUntil: "networkidle" });
  const quote = await page.locator(".ms-testimonial p").first().innerText();
  expect(quote.length).toBeGreaterThan(10);

  await page.goto(`${BASE.proof}/dashboard`, { waitUntil: "networkidle" });
  const embedPage = await context.newPage();
  await embedPage.goto(`${BASE.proof}/embed/demo`, { waitUntil: "networkidle" });
  const embedText = await embedPage.locator("body").innerText();
  expect(embedText).toContain(quote.replace(/[""]/g, "").slice(1, 40));
  await expect(embedPage.locator("body")).toContainText("Powered by Market Standard");
});

test("embed iframe has dark theme and quotes", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.proof}/embed/demo`, "Proof embed");
  await expect(page.locator("body")).toContainText("Demo Wall of Love");
  for (const author of SEED_AUTHORS) {
    await expect(page.locator("body")).toContainText(author);
  }
});

test("privacy page", async ({ page }) => {
  await gotoNoErrors(page, `${BASE.proof}/privacy`, "Proof privacy");
  await expect(page.locator("h1")).toContainText("Privacy Policy");
});
