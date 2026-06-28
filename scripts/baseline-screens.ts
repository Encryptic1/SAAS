/* Capture baseline Playwright screenshots for every app route at desktop + mobile viewports.
 * Usage: pnpm exec tsx scripts/baseline-screens.ts [--out=screens/baseline] [--which=baseline|after]
 * Writes PNGs to {out}/{app}/{route-slug}-{viewport}.png and a manifest.json.
 */
import { chromium, type Browser } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

type Viewport = { width: number; height: number; name: string };

const VIEWPORTS: Viewport[] = [
  { width: 1280, height: 800, name: "desktop" },
  { width: 375, height: 800, name: "mobile" },
];

const BASE = {
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
} as const;

type RouteSpec = { app: keyof typeof BASE; name: string; path: string };

const ROUTES: RouteSpec[] = [
  { app: "polls", name: "home", path: "/" },
  { app: "polls", name: "privacy", path: "/privacy" },
  { app: "polls", name: "login", path: "/login" },
  { app: "polls", name: "dashboard", path: "/dashboard" },
  { app: "polls", name: "dashboard-polls", path: "/dashboard/polls" },
  { app: "polls", name: "dashboard-analytics", path: "/dashboard/analytics" },
  { app: "polls", name: "dashboard-standup", path: "/dashboard/standup" },
  { app: "polls", name: "dashboard-digest", path: "/dashboard/digest" },
  { app: "polls", name: "dashboard-settings", path: "/dashboard/settings" },
  { app: "polls", name: "dashboard-billing", path: "/dashboard/billing" },
  { app: "polls", name: "dev", path: "/dev" },

  { app: "proof", name: "home", path: "/" },
  { app: "proof", name: "privacy", path: "/privacy" },
  { app: "proof", name: "login", path: "/login" },
  { app: "proof", name: "dashboard", path: "/dashboard" },
  { app: "proof", name: "dashboard-collections", path: "/dashboard/collections" },
  { app: "proof", name: "dashboard-analytics", path: "/dashboard/analytics" },
  { app: "proof", name: "dashboard-settings", path: "/dashboard/settings" },
  { app: "proof", name: "dashboard-billing", path: "/dashboard/billing" },

  { app: "metrics", name: "home", path: "/" },
  { app: "metrics", name: "privacy", path: "/privacy" },
  { app: "metrics", name: "login", path: "/login" },
  { app: "metrics", name: "dashboard", path: "/dashboard" },
  { app: "metrics", name: "dashboard-analytics", path: "/dashboard/analytics" },
  { app: "metrics", name: "dashboard-links", path: "/dashboard/links" },
  { app: "metrics", name: "dashboard-quota", path: "/dashboard/quota" },
  { app: "metrics", name: "dashboard-settings", path: "/dashboard/settings" },
  { app: "metrics", name: "dashboard-billing", path: "/dashboard/billing" },

  { app: "hook", name: "home", path: "/" },
  { app: "hook", name: "privacy", path: "/privacy" },
  { app: "hook", name: "login", path: "/login" },
  { app: "hook", name: "dashboard", path: "/dashboard" },
  { app: "hook", name: "dashboard-inboxes", path: "/dashboard/inboxes" },
  { app: "hook", name: "dashboard-billing", path: "/dashboard/billing" },

  { app: "release", name: "home", path: "/" },
  { app: "release", name: "privacy", path: "/privacy" },
  { app: "release", name: "login", path: "/login" },
  { app: "release", name: "dashboard", path: "/dashboard" },

  { app: "vault", name: "home", path: "/" },
  { app: "vault", name: "privacy", path: "/privacy" },
  { app: "vault", name: "login", path: "/login" },
  { app: "vault", name: "dashboard", path: "/dashboard" },

  { app: "links", name: "home", path: "/" },
  { app: "links", name: "privacy", path: "/privacy" },
  { app: "links", name: "login", path: "/login" },
  { app: "links", name: "dashboard", path: "/dashboard" },

  { app: "snippets", name: "home", path: "/" },
  { app: "snippets", name: "privacy", path: "/privacy" },
  { app: "snippets", name: "login", path: "/login" },
  { app: "snippets", name: "dashboard", path: "/dashboard" },

  { app: "status", name: "home", path: "/" },
  { app: "status", name: "privacy", path: "/privacy" },
  { app: "status", name: "login", path: "/login" },
  { app: "status", name: "dashboard", path: "/dashboard" },

  { app: "regex", name: "home", path: "/" },
  { app: "regex", name: "privacy", path: "/privacy" },
  { app: "regex", name: "login", path: "/login" },
  { app: "regex", name: "dashboard", path: "/dashboard" },
  { app: "regex", name: "dashboard-cheat-sheet", path: "/dashboard/cheat-sheet" },

  { app: "postmortem", name: "home", path: "/" },
  { app: "postmortem", name: "privacy", path: "/privacy" },
  { app: "postmortem", name: "login", path: "/login" },
  { app: "postmortem", name: "dashboard", path: "/dashboard" },
  { app: "postmortem", name: "dashboard-new", path: "/dashboard/new" },
  { app: "postmortem", name: "dashboard-recurrence", path: "/dashboard/recurrence" },
];

function parseArgs(): { outDir: string; which: string; filter?: string } {
  const args = process.argv.slice(2);
  let outDir = "screens/baseline";
  let which = "baseline";
  let filter: string | undefined;
  for (const arg of args) {
    if (arg.startsWith("--out=")) outDir = arg.slice(6);
    if (arg.startsWith("--which=")) which = arg.slice(8);
    if (arg.startsWith("--filter=")) filter = arg.slice(9);
  }
  if (which === "after") outDir = "screens/after";
  return { outDir, which, filter };
}

async function captureRoute(
  browser: Browser,
  route: RouteSpec,
  viewport: Viewport,
  outDir: string,
): Promise<{ route: RouteSpec; viewport: string; status: "ok" | "fail"; error?: string; ms: number }> {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const url = `${BASE[route.app]}${route.path}`;
  const start = Date.now();
  try {
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      return { route, viewport: viewport.name, status: "fail", error: `HTTP ${status}`, ms: Date.now() - start };
    }
    // Give fonts + images a moment to settle.
    await page.waitForTimeout(400);
    const appDir = path.join(outDir, route.app);
    fs.mkdirSync(appDir, { recursive: true });
    const file = path.join(appDir, `${route.name}-${viewport.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    return { route, viewport: viewport.name, status: "ok", ms: Date.now() - start };
  } catch (err) {
    return {
      route,
      viewport: viewport.name,
      status: "fail",
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
}

async function main(): Promise<void> {
  const { outDir, which, filter } = parseArgs();
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  let routes = ROUTES;
  if (filter) {
    const filters = filter.split(",").map((f) => f.trim()).filter(Boolean);
    routes = ROUTES.filter((r) =>
      filters.some((f) => {
        if (f.includes("/")) {
          const [app, name] = f.split("/");
          return r.app === app && r.name.includes(name);
        }
        return r.app === f || r.name.includes(f);
      }),
    );
  }

  const results: Array< Awaited< ReturnType< typeof captureRoute > > > = [];
  console.log(`[screens] Capturing ${routes.length} routes × ${VIEWPORTS.length} viewports → ${outDir}${filter ? ` (filter: ${filter})` : ""}`);

  for (const route of routes) {
    for (const viewport of VIEWPORTS) {
      const result = await captureRoute(browser, route, viewport, outDir);
      const tag = result.status === "ok" ? "OK " : "FAIL";
      console.log(
        `[${tag}] ${route.app}/${route.name}-${viewport.name} (${result.ms}ms${result.error ? ` :: ${result.error}` : ""})`,
      );
      results.push(result);
    }
  }

  await browser.close();

  const ok = results.filter((r) => r.status === "ok").length;
  const fail = results.length - ok;
  const manifest = {
    which,
    capturedAt: new Date().toISOString(),
    total: results.length,
    ok,
    fail,
    results: results.map((r) => ({
      app: r.route.app,
      route: r.route.name,
      path: r.route.path,
      viewport: r.viewport,
      status: r.status,
      error: r.error,
      ms: r.ms,
    })),
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[screens] Done. ok=${ok} fail=${fail} → ${outDir}/manifest.json`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
