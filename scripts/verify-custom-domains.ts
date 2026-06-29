/**
 * Verify the 14 *.marketstandard.app custom domains are live + capture
 * desktop screenshots to check layout/spacing.
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "custom-domains");
fs.mkdirSync(OUT, { recursive: true });

const APPS = [
  "polls",
  "proof",
  "metrics",
  "hook",
  "release",
  "vault",
  "links",
  "snippets",
  "status",
  "regex",
  "postmortem",
  "lens",
  "cron",
  "workspace",
];

async function main() {
  // 1. HTTP check (no browser — fast)
  console.log("--- HTTP check (custom domain /api/health) ---");
  const httpResults: Array<{ sub: string; status: number; finalUrl: string }> = [];
  for (const sub of APPS) {
    const url = `https://${sub}.marketstandard.app/api/health`;
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
      httpResults.push({ sub, status: res.status, finalUrl: res.url });
      console.log(
        `  ${res.status === 200 ? "OK  " : "FAIL"} ${sub.padEnd(14)} ${res.status}  ${res.url.slice(0, 70)}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      httpResults.push({ sub, status: 0, finalUrl: msg });
      console.log(`  FAIL ${sub.padEnd(14)} ERR  ${msg.slice(0, 80)}`);
    }
  }

  // 2. Desktop screenshots of each home page
  console.log("\n--- Desktop screenshots (1440x900) ---");
  const browser: Browser = await chromium.launch();
  let ok = 0;
  let fail = 0;
  for (const sub of APPS) {
    const url = `https://${sub}.marketstandard.app/`;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const outFile = path.join(OUT, `${sub}-home.desktop.png`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: outFile, fullPage: false });
      const title = await page.title();
      console.log(
        `  OK   ${sub.padEnd(14)} "${title.slice(0, 50)}" -> screens/custom-domains/${sub}-home.desktop.png`,
      );
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  FAIL ${sub.padEnd(14)} ${msg.slice(0, 80)}`);
      fail++;
    } finally {
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n=== Screenshots: ${ok} ok, ${fail} failed ===`);

  const httpOk = httpResults.filter((r) => r.status === 200).length;
  console.log(`=== HTTP health: ${httpOk}/${APPS.length} returning 200 ===`);
  process.exit(fail === 0 && httpOk === APPS.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
