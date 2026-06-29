/**
 * Verify the 14 *.marketstandard.app custom domains are live + capture
 * desktop screenshots to check layout/spacing.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
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
  console.log("--- HTTP check (custom domain -> final URL + status) ---");
  const httpResults = [];
  for (const sub of APPS) {
    const url = `https://${sub}.marketstandard.app/api/health`;
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
      const finalUrl = res.url;
      const status = res.status;
      httpResults.push({ sub, status, finalUrl });
      const matchesVercel = finalUrl.includes("vercel.app") || finalUrl.includes("marketstandard.app");
      console.log(`  ${status === 200 ? "OK" : "FAIL"} ${sub.padEnd(14)} ${status}  ${finalUrl.slice(0, 70)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      httpResults.push({ sub, status: 0, finalUrl: msg });
      console.log(`  FAIL ${sub.padEnd(14)} ERR  ${msg.slice(0, 80)}`);
    }
  }

  // 2. Desktop screenshots of each home page
  console.log("\n--- Desktop screenshots (1440x900) ---");
  const browser = await chromium.launch();
  let ok = 0;
  let fail = 0;
  for (const sub of APPS) {
    const url = `https://${sub}.marketstandard.app/`;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const outFile = path.join(OUT, `${sub}-home.desktop.png`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      // Wait a bit for any client-side rendering
      await page.waitForTimeout(2000);
      await page.screenshot({ path: outFile, fullPage: false });
      const title = await page.title();
      console.log(`  OK   ${sub.padEnd(14)} "${title.slice(0, 50)}" -> ${outFile.split(path.sep).slice(-3).join("/")}`);
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
  console.log(`Screenshots in: ${OUT}`);

  const httpOk = httpResults.filter((r) => r.status === 200).length;
  console.log(`\n=== HTTP health: ${httpOk}/${APPS.length} returning 200 ===`);
  process.exit(fail === 0 && httpOk === APPS.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
