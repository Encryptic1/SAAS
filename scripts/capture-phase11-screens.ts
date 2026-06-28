/**
 * Capture Phase 11 screenshots: Standard Workspace dashboards. Saves under
 * screens/phase11/. Reuses the running local dev stack (pnpm dev:local).
 */
import { chromium, type Browser } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "screens", "phase11");

const BASE = "http://localhost:3014";

const ROUTES = [
  { key: "home", path: "/" },
  { key: "dashboard", path: "/dashboard" },
  { key: "sessions", path: "/dashboard/sessions" },
  { key: "tunnels", path: "/dashboard/tunnels" },
  { key: "health", path: "/dashboard/health" },
  { key: "depsync", path: "/dashboard/depsync" },
  { key: "billing", path: "/dashboard/billing" },
  { key: "docs", path: "/docs" },
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
    await page.waitForTimeout(1500);
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
  console.log(`Capturing ${ROUTES.length} routes x 2 viewports -> screens/phase11`);
  for (const route of ROUTES) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await shot(browser, `${BASE}${route.path}`, `workspace-${route.key}-${vpName}`, vp);
    }
  }
  await browser.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
