/**
 * Capture Phase 9 screenshots: /docs user docs page (with search + Loom
 * placeholders) and /api/docs Swagger UI for representative apps. Saves under
 * screens/phase9/. Reuses the running local dev stack (pnpm dev:local).
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "phase9");

const APPS = [
  { key: "polls", base: "http://localhost:3001" },
  { key: "vault", base: "http://localhost:3006" },
  { key: "lens", base: "http://localhost:3012" },
  { key: "cron", base: "http://localhost:3013" },
] as const;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

async function shot(
  browser: Browser,
  url: string,
  outName: string,
  viewport: { width: number; height: number },
) {
  const page = await browser.newPage({ viewport });
  try {
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    const status = res?.status() ?? 0;
    if (status >= 400) {
      console.warn(`  ${outName}: HTTP ${status} — skipping`);
      return;
    }
    // Give Swagger UI / docs a moment to settle.
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${outName}.png`), fullPage: true });
    console.log(`  ${outName}.png  (${status})`);
  } catch (err) {
    console.warn(`  ${outName}: ${(err as Error).message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const app of APPS) {
    console.log(`[${app.key}]`);
    await shot(browser, `${app.base}/docs`, `${app.key}-docs-desktop`, VIEWPORTS.desktop);
    await shot(browser, `${app.base}/docs`, `${app.key}-docs-mobile`, VIEWPORTS.mobile);
    await shot(browser, `${app.base}/api/docs`, `${app.key}-swagger-desktop`, VIEWPORTS.desktop);
  }

  await browser.close();
  console.log(`Phase 9 screenshots saved to ${path.relative(ROOT, OUT)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
