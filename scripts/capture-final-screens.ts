/**
 * Final phase: capture "after" screenshots for all 14 apps across desktop +
 * mobile viewports. Covers the marketing landing and the main dashboard for
 * each app. Saves PNGs under screens/final/<slug>.<viewport>.png.
 *
 * Reuses the running local dev stack (must be started via `pnpm dev:local`).
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCREENS_ROOT = path.join(ROOT, "screens");

interface Shot {
  name: string;
  url: string;
  /** SSE/polling pages use domcontentloaded instead of networkidle. */
  domOnly?: boolean;
}

const APPS: Array<{ slug: string; port: number; dashboardPath?: string; domOnly?: boolean }> = [
  { slug: "polls", port: 3001, dashboardPath: "/dashboard" },
  { slug: "proof", port: 3002, dashboardPath: "/dashboard" },
  { slug: "metrics", port: 3003, dashboardPath: "/dashboard" },
  { slug: "hook", port: 3004, dashboardPath: "/dashboard" },
  { slug: "release", port: 3005, dashboardPath: "/dashboard" },
  { slug: "vault", port: 3006, dashboardPath: "/dashboard" },
  { slug: "links", port: 3007, dashboardPath: "/dashboard" },
  { slug: "snippets", port: 3008, dashboardPath: "/dashboard" },
  { slug: "status", port: 3009, dashboardPath: "/dashboard" },
  { slug: "regex", port: 3010, dashboardPath: "/dashboard" },
  { slug: "postmortem", port: 3011, dashboardPath: "/dashboard" },
  { slug: "lens", port: 3012, dashboardPath: "/dashboard" },
  { slug: "cron", port: 3013, dashboardPath: "/dashboard" },
  { slug: "workspace", port: 3014, dashboardPath: "/dashboard", domOnly: true },
];

const SHOTS: Shot[] = [];
for (const app of APPS) {
  const base = `http://localhost:${app.port}`;
  SHOTS.push({ name: `${app.slug}-home`, url: `${base}/` });
  if (app.dashboardPath) {
    SHOTS.push({ name: `${app.slug}-dashboard`, url: `${base}${app.dashboardPath}`, domOnly: app.domOnly });
  }
  SHOTS.push({ name: `${app.slug}-billing`, url: `${base}/dashboard/billing` });
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

async function main() {
  const outDir = path.join(SCREENS_ROOT, "final");
  fs.mkdirSync(outDir, { recursive: true });

  const browser: Browser = await chromium.launch();
  const captured: string[] = [];
  const failed: string[] = [];

  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const shot of SHOTS) {
      const file = path.join(outDir, `${shot.name}.${label}.png`);
      try {
        await page.goto(shot.url, {
          waitUntil: shot.domOnly ? "domcontentloaded" : "networkidle",
          timeout: 30_000,
        });
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(600);
        await page.screenshot({ path: file, fullPage: true });
        captured.push(path.relative(ROOT, file));
      } catch (err) {
        failed.push(`${shot.name}.${label}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log(`Captured ${captured.length} screenshot(s) -> ${path.relative(ROOT, outDir)}/`);
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
