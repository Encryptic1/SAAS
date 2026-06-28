import { expect, test } from "@playwright/test";
import {
  BASE,
  collectPageErrors,
  expectDarkTheme,
  expectNoErrors,
  isMobileProject,
} from "./helpers";

const HOMES = [
  {
    name: "Polls",
    url: BASE.polls,
    hero: /brand moment/i,
    cta: /Mock Add to Slack/i,
    ctaHref: /mock-install/,
  },
  {
    name: "Proof",
    url: BASE.proof,
    hero: /on every page/i,
    cta: /Open Dashboard/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Metrics",
    url: BASE.metrics,
    hero: /without the spreadsheet/i,
    cta: /Open Demo Dashboard/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Hook",
    url: BASE.hook,
    hero: /webhook|hook|capture/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Release",
    url: BASE.release,
    hero: /release|changelog|notes/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Vault",
    url: BASE.vault,
    hero: /secret|vault|dotenv/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Links",
    url: BASE.links,
    hero: /link|short|redirect/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Snippets",
    url: BASE.snippets,
    hero: /snippet|code|library/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Status",
    url: BASE.status,
    hero: /status|pipeline|deploy/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Regex",
    url: BASE.regex,
    hero: /regex|pattern|debug/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
  {
    name: "Postmortem",
    url: BASE.postmortem,
    hero: /postmortem|incident|recurrence/i,
    cta: /Open Dashboard|Get started/i,
    ctaHref: /\/dashboard/,
  },
] as const;

for (const home of HOMES) {
  test(`${home.name} marketing home — hero, CTA, footer`, async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await page.goto(home.url, { waitUntil: "networkidle" });
    expectNoErrors(errors, `${home.name} home`);

    await expect(page.locator("h1")).toContainText(home.hero);
    await expect(page.locator(".ms-local-banner")).toContainText("Local dev");

    const cta = page.getByRole("link", { name: home.cta }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", home.ctaHref);

    const siteFooter = page.getByRole("contentinfo");
    await expect(siteFooter).toContainText("Market Standard, LLC");
    await expect(siteFooter.getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(siteFooter.getByRole("link", { name: "Standard Polls" })).toHaveAttribute("href", BASE.polls);
    await expect(siteFooter.getByRole("link", { name: "Standard Proof" })).toHaveAttribute("href", BASE.proof);
    await expect(siteFooter.getByRole("link", { name: "Standard Metrics" })).toHaveAttribute("href", BASE.metrics);
  });

  test(`${home.name} marketing home — mobile nav`, async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "mobile only");

    await page.goto(home.url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.locator("#ms-mobile-nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Mission" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Features" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
  });
}

test("Polls secondary CTA links to /dev", async ({ page }) => {
  await page.goto(BASE.polls, { waitUntil: "networkidle" });
  const devCta = page.getByRole("link", { name: /Try poll simulator/i });
  await expect(devCta).toHaveAttribute("href", "/dev");
});

test("Local dev banner portfolio links navigate", async ({ page }) => {
  await page.goto(BASE.polls, { waitUntil: "networkidle" });
  const banner = page.locator(".ms-local-banner");
  await banner.getByRole("link", { name: "Metrics" }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE.metrics.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});

test("Privacy link from footer navigates", async ({ page }) => {
  await page.goto(BASE.proof, { waitUntil: "networkidle" });
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy/);
  await expect(page.locator("h1")).toContainText("Privacy Policy");
  await expectDarkTheme(page, "Proof privacy");
});
