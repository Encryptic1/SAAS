import { expect, test } from "@playwright/test";
import {
  BASE,
  clickHeaderNavLink,
  collectPageErrors,
  escapeRegExp,
  expectNoErrors,
  heroAside,
  isMobileProject,
} from "./helpers";

test.describe("Marketing home CTAs navigate", () => {
  test("Polls — Mock Add to Slack", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.locator(".ms-marketing").getByRole("link", { name: /Mock Add to Slack/i }).first().click();
    await expect(page).toHaveURL(/installed=true/, { timeout: 30_000 });
    expectNoErrors(errors, "Polls mock install");
  });

  test("Polls — Try poll simulator", async ({ page }) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Try poll simulator/i }).first().click();
    await expect(page).toHaveURL(/\/dev$/);
    await expect(page.getByRole("button", { name: /Create poll/i })).toBeVisible();
  });

  test("Polls — hero aside portfolio options", async ({ page }) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await heroAside(page).getByRole("link", { name: "Standard Proof" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.proof)));
  });

  test("Proof — Open Dashboard", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Open Dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("h1").first()).toContainText(/overview|dashboard/i);
  });

  test("Proof — View demo wall (hero CTA)", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.locator(".ms-marketing section").first().getByRole("link", { name: /View demo wall/i }).first().click();
    await expect(page).toHaveURL(/\/c\/demo/);
    await expect(page.locator(".ms-testimonial")).toHaveCount(3);
  });

  test("Proof — See features scrolls to capabilities", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /See features/i }).click();
    await expect(page).toHaveURL(/#capabilities/);
    await expect(page.locator("#capabilities")).toBeInViewport();
  });

  test("Metrics — Open Demo Dashboard (hero CTA)", async ({ page }) => {
    await page.goto(BASE.metrics, { waitUntil: "networkidle" });
    await page.locator(".ms-marketing section").first().getByRole("link", { name: /Open Demo Dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("body")).toContainText("$12,400");
  });

  test("Metrics — See pricing anchor", async ({ page }) => {
    await page.goto(BASE.metrics, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /See pricing/i }).click();
    await expect(page).toHaveURL(/#capabilities/);
    await expect(page.locator("#capabilities")).toBeInViewport();
  });

  test("Proof — hero aside View demo wall", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await heroAside(page).getByRole("link", { name: /View demo wall/i }).click();
    await expect(page).toHaveURL(/\/c\/demo/);
  });

  test("Metrics — hero aside Open demo dashboard", async ({ page }) => {
    await page.goto(BASE.metrics, { waitUntil: "networkidle" });
    await heroAside(page).getByRole("link", { name: /Open demo dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard\?connected=true/);
  });
});

test.describe("Nav and footer links", () => {
  test("Polls nav Mission anchor", async ({ page }, testInfo) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await clickHeaderNavLink(page, "Mission", testInfo.project.name);
    await expect(page).toHaveURL(/#mission/);
    await expect(page.locator("#mission")).toBeInViewport();
  });

  test("Polls nav Features anchor", async ({ page }, testInfo) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await clickHeaderNavLink(page, "Features", testInfo.project.name);
    await expect(page).toHaveURL(/#capabilities/);
  });

  test("Polls nav sibling Proof link", async ({ page }, testInfo) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await clickHeaderNavLink(page, "Proof", testInfo.project.name, { exact: true });
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.proof)));
  });

  test("Proof nav sibling Polls link", async ({ page }, testInfo) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await clickHeaderNavLink(page, "Polls", testInfo.project.name, { exact: true });
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.polls)));
  });

  test("Metrics nav sibling Proof link", async ({ page }, testInfo) => {
    await page.goto(BASE.metrics, { waitUntil: "networkidle" });
    await clickHeaderNavLink(page, "Proof", testInfo.project.name, { exact: true });
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.proof)));
  });

  test("Marketing logo returns home", async ({ page }) => {
    await page.goto(`${BASE.polls}#mission`, { waitUntil: "networkidle" });
    await page.locator("header").getByRole("link", { name: /Standard Polls/i }).click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(BASE.polls)}/?$`));
  });

  test("Footer Standard Metrics link", async ({ page }) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.getByRole("contentinfo").getByRole("link", { name: "Standard Metrics" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.metrics)));
  });

  test("Footer Privacy link on each app", async ({ page }) => {
    for (const app of [BASE.polls, BASE.proof, BASE.metrics] as const) {
      await page.goto(app, { waitUntil: "networkidle" });
      await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
      await expect(page).toHaveURL(/\/privacy$/);
      await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    }
  });

  test("Local dev banner Proof link", async ({ page }) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.locator(".ms-local-banner").getByRole("link", { name: "Proof" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.proof)));
  });

  test("Local dev banner Polls link from Proof", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.locator(".ms-local-banner").getByRole("link", { name: "Polls" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.polls)));
  });
});

test.describe("Mobile menu navigation", () => {
  test("Polls mobile menu — Mission link", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "mobile only");
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#ms-mobile-nav").getByRole("link", { name: "Mission" }).click();
    await expect(page).toHaveURL(/#mission/);
  });

  test("Polls mobile menu — Metrics sibling", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "mobile only");
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#ms-mobile-nav").getByRole("link", { name: "Metrics" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.metrics)));
  });

  test("Proof mobile menu — Open Dashboard", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "mobile only");
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#ms-mobile-nav").getByRole("link", { name: /Open Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Metrics mobile menu — Open Demo Dashboard", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "mobile only");
    await page.goto(BASE.metrics, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#ms-mobile-nav").getByRole("link", { name: /Open Demo Dashboard/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("App tool pages", () => {
  test("Polls dev — back link and submit", async ({ page }) => {
    await page.goto(`${BASE.polls}/dev`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Back to home/i }).click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(BASE.polls)}/?$`));

    await page.goto(`${BASE.polls}/dev`, { waitUntil: "networkidle" });
    await page.getByLabel("Question").fill(`Button test ${Date.now()}?`);
    await page.getByLabel("Options (one per line)").fill("A\nB");
    await page.getByRole("button", { name: /Create poll/i }).click();
    await expect(page).toHaveURL(/poll_created=true/);
  });

  test("Proof dashboard — View public page and Preview embed", async ({ page }) => {
    await page.goto(`${BASE.proof}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Public page/i }).first().click();
    await expect(page).toHaveURL(/\/c\/demo/);

    await page.goto(`${BASE.proof}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /preview embed/i }).click();
    await expect(page).toHaveURL(/\/embed\/demo/);
  });

  test("Proof demo wall — PoweredBy badge is clickable", async ({ page }) => {
    await page.goto(`${BASE.proof}/c/demo`, { waitUntil: "networkidle" });
    const badge = page.getByRole("link", { name: /Powered by/i });
    await expect(badge).toHaveAttribute("href", /marketstandard/);
    await expect(badge).toHaveAttribute("target", "_blank");
  });

  test("Privacy back links on all apps", async ({ page }) => {
    for (const [app, name] of [
      [BASE.polls, "Standard Polls"],
      [BASE.proof, "Standard Proof"],
      [BASE.metrics, "Standard Metrics"],
    ] as const) {
      await page.goto(`${app}/privacy`, { waitUntil: "networkidle" });
      await page.getByRole("link", { name: new RegExp(`Back to ${name}`) }).click();
      await expect(page).toHaveURL(new RegExp(`${escapeRegExp(app)}/?$`));
    }
  });

  test("Metrics dashboard portfolio links", async ({ page }) => {
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("main").getByRole("link", { name: "Polls" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.polls)));

    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await page.getByRole("main").getByRole("link", { name: "Proof" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.proof)));
  });

  test("Metrics dashboard local dev banner", async ({ page }) => {
    await page.goto(`${BASE.metrics}/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".ms-local-banner").getByRole("link", { name: "Polls" }).click();
    await expect(page).toHaveURL(new RegExp(escapeRegExp(BASE.polls)));
  });
});

test.describe("Bottom CTA on marketing pages", () => {
  test("Polls bottom Mock Add to Slack", async ({ page }) => {
    await page.goto(BASE.polls, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /Organic growth/i }).scrollIntoViewIfNeeded();
    await page.locator(".ms-marketing").getByRole("link", { name: /Mock Add to Slack/i }).last().click();
    await expect(page).toHaveURL(/installed=true/);
  });

  test("Proof bottom Open Dashboard", async ({ page }) => {
    await page.goto(BASE.proof, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /widest reach/i }).scrollIntoViewIfNeeded();
    await page.locator(".ms-marketing").getByRole("link", { name: /Open Dashboard/i }).last().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
