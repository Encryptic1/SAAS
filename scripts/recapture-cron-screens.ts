/**
 * Re-capture Cron screenshots after the DB reset that fixed the
 * notifications/team 500 errors. Updates only the 6 Cron screenshots in
 * screens/final/ (home, dashboard, billing × desktop + mobile).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "final");
const CRON = "http://localhost:3013";

const SHOTS = [
  { name: "cron-home", url: `${CRON}/` },
  { name: "cron-dashboard", url: `${CRON}/dashboard` },
  { name: "cron-billing", url: `${CRON}/dashboard/billing` },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const shot of SHOTS) {
      const file = path.join(OUT, `${shot.name}.${label}.png`);
      await page.goto(shot.url, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  ${path.relative(ROOT, file)}`);
    }
    await ctx.close();
  }
  await browser.close();
  console.log("Done — Cron screenshots re-captured.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
