/**
 * Capture Playwright screenshots for a list of routes across desktop + mobile
 * viewports. Saves PNGs under screens/<phase>/<slug>.<viewport>.png.
 *
 * Usage:
 *   pnpm exec tsx scripts/capture-screens.ts --phase phase6
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
}

const LENS = "http://localhost:3012";
const CRON = "http://localhost:3013";

const SHOTS: Shot[] = [
  { name: "lens-home", url: `${LENS}/` },
  { name: "lens-dashboard", url: `${LENS}/dashboard` },
  { name: "lens-slow", url: `${LENS}/dashboard/slow` },
  { name: "lens-explain", url: `${LENS}/dashboard/explain` },
  { name: "lens-billing", url: `${LENS}/dashboard/billing` },
  { name: "cron-home", url: `${CRON}/` },
  { name: "cron-dashboard", url: `${CRON}/dashboard` },
  { name: "cron-billing", url: `${CRON}/dashboard/billing` },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

function argValue(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

async function main() {
  const phase = argValue("--phase", "phase6");
  const outDir = path.join(SCREENS_ROOT, phase);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const captured: string[] = [];
  const failed: string[] = [];

  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    for (const shot of SHOTS) {
      const file = path.join(outDir, `${shot.name}.${label}.png`);
      try {
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 30_000 });
        await page.waitForLoadState("domcontentloaded");
        // Give client hydration a beat.
        await page.waitForTimeout(500);
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
