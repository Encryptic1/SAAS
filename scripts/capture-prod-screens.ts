/**
 * Capture production screenshots for all 14 apps from their Vercel URLs.
 * Saves PNGs under screens/prod/<slug>.<viewport>.png.
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "prod");
fs.mkdirSync(OUT, { recursive: true });

const APPS: Array<{ slug: string; url: string; domOnly?: boolean }> = [
  { slug: "polls", url: "https://standard-polls.vercel.app/" },
  { slug: "proof", url: "https://standard-proof.vercel.app/" },
  { slug: "metrics", url: "https://standard-metrics.vercel.app/" },
  { slug: "hook", url: "https://standard-hook.vercel.app/" },
  { slug: "release", url: "https://standard-release.vercel.app/" },
  { slug: "vault", url: "https://standard-vault.vercel.app/" },
  { slug: "links", url: "https://standard-links.vercel.app/" },
  { slug: "snippets", url: "https://standard-snippets.vercel.app/" },
  { slug: "status", url: "https://standard-status.vercel.app/" },
  { slug: "regex", url: "https://standard-regex.vercel.app/" },
  { slug: "postmortem", url: "https://standard-postmortem.vercel.app/" },
  { slug: "lens", url: "https://standard-lens.vercel.app/" },
  { slug: "cron", url: "https://standard-cron.vercel.app/" },
  { slug: "workspace", url: "https://standard-workspace.vercel.app/", domOnly: true },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

async function main() {
  const browser: Browser = await chromium.launch();
  let ok = 0;
  let fail = 0;

  for (const app of APPS) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const outFile = path.join(OUT, `${app.slug}-home.${vpName}.png`);
      try {
        await page.goto(app.url, {
          waitUntil: app.domOnly ? "domcontentloaded" : "networkidle",
          timeout: 30000,
        });
        await page.screenshot({ path: outFile, fullPage: false });
        console.log(`  OK  ${app.slug}-home.${vpName}.png`);
        ok++;
      } catch (err) {
        console.error(`  FAIL ${app.slug}-home.${vpName}.png: ${(err as Error).message.slice(0, 120)}`);
        fail++;
      } finally {
        await ctx.close();
      }
    }
  }

  await browser.close();
  console.log(`\nProduction screenshots: ${ok} ok, ${fail} failed.`);
}

main().catch(console.error);
