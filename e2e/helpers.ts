import { expect, type Page } from "@playwright/test";

export const BASE = {
  polls: "http://localhost:3001",
  proof: "http://localhost:3002",
  metrics: "http://localhost:3003",
  hook: "http://localhost:3004",
  release: "http://localhost:3005",
  vault: "http://localhost:3006",
  links: "http://localhost:3007",
  snippets: "http://localhost:3008",
  status: "http://localhost:3009",
  regex: "http://localhost:3010",
  postmortem: "http://localhost:3011",
  gateway: "http://127.0.0.1:4000",
} as const;

export const ROUTES = [
  { name: "Polls home", url: `${BASE.polls}/`, marketing: true },
  { name: "Polls dev", url: `${BASE.polls}/dev`, app: true },
  { name: "Polls privacy", url: `${BASE.polls}/privacy`, marketing: true },
  { name: "Proof home", url: `${BASE.proof}/`, marketing: true },
  { name: "Proof dashboard", url: `${BASE.proof}/dashboard`, app: true },
  { name: "Proof demo wall", url: `${BASE.proof}/c/demo`, app: true },
  { name: "Proof embed", url: `${BASE.proof}/embed/demo`, app: false },
  { name: "Proof privacy", url: `${BASE.proof}/privacy`, marketing: true },
  { name: "Metrics home", url: `${BASE.metrics}/`, marketing: true },
  { name: "Metrics dashboard", url: `${BASE.metrics}/dashboard`, app: true },
  { name: "Metrics privacy", url: `${BASE.metrics}/privacy`, marketing: true },
  { name: "Hook home", url: `${BASE.hook}/`, marketing: true },
  { name: "Hook dashboard", url: `${BASE.hook}/dashboard`, app: true },
  { name: "Hook privacy", url: `${BASE.hook}/privacy`, marketing: true },
  { name: "Release home", url: `${BASE.release}/`, marketing: true },
  { name: "Release dashboard", url: `${BASE.release}/dashboard`, app: true },
  { name: "Release privacy", url: `${BASE.release}/privacy`, marketing: true },
  { name: "Vault home", url: `${BASE.vault}/`, marketing: true },
  { name: "Vault dashboard", url: `${BASE.vault}/dashboard`, app: true },
  { name: "Vault privacy", url: `${BASE.vault}/privacy`, marketing: true },
  { name: "Links home", url: `${BASE.links}/`, marketing: true },
  { name: "Links dashboard", url: `${BASE.links}/dashboard`, app: true },
  { name: "Links privacy", url: `${BASE.links}/privacy`, marketing: true },
  { name: "Snippets home", url: `${BASE.snippets}/`, marketing: true },
  { name: "Snippets dashboard", url: `${BASE.snippets}/dashboard`, app: true },
  { name: "Snippets privacy", url: `${BASE.snippets}/privacy`, marketing: true },
  { name: "Status home", url: `${BASE.status}/`, marketing: true },
  { name: "Status dashboard", url: `${BASE.status}/dashboard`, app: true },
  { name: "Status privacy", url: `${BASE.status}/privacy`, marketing: true },
  { name: "Regex home", url: `${BASE.regex}/`, marketing: true },
  { name: "Regex dashboard", url: `${BASE.regex}/dashboard`, app: true },
  { name: "Regex cheat sheet", url: `${BASE.regex}/dashboard/cheat-sheet`, app: true },
  { name: "Regex privacy", url: `${BASE.regex}/privacy`, marketing: true },
  { name: "Postmortem home", url: `${BASE.postmortem}/`, marketing: true },
  { name: "Postmortem dashboard", url: `${BASE.postmortem}/dashboard`, app: true },
  { name: "Postmortem new", url: `${BASE.postmortem}/dashboard/new`, app: true },
  { name: "Postmortem recurrence", url: `${BASE.postmortem}/dashboard/recurrence`, app: true },
  { name: "Postmortem privacy", url: `${BASE.postmortem}/privacy`, marketing: true },
] as const;

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

export function expectNoErrors(errors: string[], label: string): void {
  expect(errors, `${label} console errors`).toEqual([]);
}

export async function expectDarkTheme(page: Page, label: string): Promise<void> {
  const bg = await page.evaluate(() => {
    const el = document.querySelector(".ms-marketing, .ms-app, body");
    if (!el) return "";
    return getComputedStyle(el).backgroundColor;
  });

  if (!bg) return;

  const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const [, r, g, b] = match.map(Number);
    const luminance = (r! + g! + b!) / 3;
    expect(luminance, `${label} background should be dark (got ${bg})`).toBeLessThan(80);
  }
}

export function parsePollsStats(text: string): { workspaces: number; polls: number } | null {
  const match = text.match(/Live data:\s*(\d+)\s+workspace[s]?,\s*(\d+)\s+poll[s]?/i);
  if (!match) return null;
  return { workspaces: Number(match[1]), polls: Number(match[2]) };
}

export function parseProofStats(text: string): { collections: number; testimonials: number } | null {
  const match = text.match(/Live data:\s*(\d+)\s+collection[s]?,\s*(\d+)\s+testimonial[s]?/i);
  if (!match) return null;
  return { collections: Number(match[1]), testimonials: Number(match[2]) };
}

export async function gotoNoErrors(page: Page, url: string, label: string): Promise<void> {
  const errors = collectPageErrors(page);
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  expect(response?.status(), `${label} HTTP status`).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text.length, `${label} should have content`).toBeGreaterThan(20);
  expect(text, `${label} should not show error page`).not.toMatch(/Application error|Internal Server Error/i);
  expectNoErrors(errors, label);
}

export function isMobileProject(projectName: string): boolean {
  return projectName === "chromium-mobile";
}

/** Hero aside panel on marketing landing pages (PollsAside / ProofAside / MetricsAside). */
export function heroAside(page: Page) {
  return page.locator(".ms-marketing section").first().locator(".ms-panel");
}

/** Desktop header nav or mobile drawer, depending on project. */
export async function clickHeaderNavLink(
  page: Page,
  name: string | RegExp,
  projectName: string,
  options?: { exact?: boolean },
): Promise<void> {
  if (isMobileProject(projectName)) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#ms-mobile-nav").getByRole("link", { name, exact: options?.exact }).click();
  } else {
    await page.locator("header nav").first().getByRole("link", { name, exact: options?.exact }).click();
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
