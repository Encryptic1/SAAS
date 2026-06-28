/**
 * Capture Phase 8 screenshots: auth status pages, notification center,
 * first-run tour, and team settings panel. Saves under screens/phase8/.
 *
 * Reuses the running local dev stack (pnpm dev:local). Seeds a notification
 * and a team so the UI has content to render.
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "phase8");

const LENS = "http://localhost:3012";
const CRON = "http://localhost:3013";
const POLLS = "http://localhost:3001";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

async function seed() {
  // One unread notification for the bell badge.
  await fetch(`${LENS}/api/notifications/read-all`, { method: "POST" }).catch(() => {});
  await fetch(`${LENS}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Welcome to Standard Lens",
      body: "Your query library is ready. Pin your most-used queries to get started.",
      href: "/dashboard",
      level: "info",
    }),
  }).catch(() => {});
  await fetch(`${LENS}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Slow query detected",
      body: "users.last_active scan exceeded 1.2s. Review it on the Slow queries tab.",
      href: "/dashboard/slow",
      level: "warn",
    }),
  }).catch(() => {});

  // A team for the team page.
  const existing = await fetch(`${LENS}/api/team`).then((r) => r.json()).catch(() => ({ teams: [] }));
  if (!existing.teams?.some((t: { slug: string }) => t.slug === "platform")) {
    await fetch(`${LENS}/api/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Platform Team", slug: "platform" }),
    }).catch(() => {});
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  await seed();

  const browser: Browser = await chromium.launch();
  const captured: string[] = [];
  const failed: string[] = [];

  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();

    const shoot = async (name: string, url: string, prep?: () => Promise<void>) => {
      const file = path.join(OUT, `${name}.${label}.png`);
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
        await page.waitForTimeout(400);
        if (prep) await prep();
        await page.screenshot({ path: file, fullPage: true });
        captured.push(path.relative(ROOT, file));
      } catch (err) {
        failed.push(`${name}.${label}: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    // Auth status pages (lens).
    await shoot("auth-loading", `${LENS}/auth/loading`);
    await shoot("auth-error-expired", `${LENS}/auth/error?reason=expired`);
    await shoot("auth-error-oauth", `${LENS}/auth/error?reason=oauth`);

    // First-run tour — clear dismissal so it shows.
    await shoot("firstrun-tour", `${LENS}/dashboard`, async () => {
      await page.evaluate(() => localStorage.removeItem("mktstd:tour-dismissed:standard-lens"));
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(400);
    });

    // Notification center — open the bell panel.
    const scope = viewport.width < 768 ? ".ms-dash-mobile-topbar" : ".ms-dash-topbar";
    await shoot("notification-center-closed", `${LENS}/dashboard`);
    await shoot("notification-center-open", `${LENS}/dashboard`, async () => {
      await page.locator(`${scope} .ms-notif-bell`).first().click();
      await page.waitForTimeout(300);
    });

    // Team settings page (lens) + cron variant.
    await shoot("team-page-lens", `${LENS}/dashboard/team`);
    await shoot("team-page-cron", `${CRON}/dashboard/team`);
    await shoot("team-page-polls", `${POLLS}/dashboard/team`);

    await context.close();
  }

  await browser.close();
  console.log(`Captured ${captured.length} screenshot(s) -> ${path.relative(ROOT, OUT)}/`);
  for (const f of captured) console.log(`  ${f}`);
  if (failed.length > 0) {
    console.error(`\n${failed.length} failed:`);
    for (const f of failed) console.error(`  ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
