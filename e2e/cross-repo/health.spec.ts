import { expect, test } from "@playwright/test";
import { APP_BASE_URLS, REQUIRED_APPS } from "./fixtures";
import { appHealthy } from "./helpers";

/**
 * Cross-repo: ms-suite health. Verifies every app in the suite responds on
 * /api/health. This is the Playwright equivalent of `ms-suite health` — it
 * exits non-zero (via test failure) when any critical check fails.
 */
test.describe("Cross-repo: ms-suite health", () => {
  test("every app + gateway is healthy", async () => {
    const failures: string[] = [];
    for (const app of REQUIRED_APPS) {
      if (!(await appHealthy(app))) failures.push(app);
    }
    if (!(await appHealthy("gateway"))) failures.push("gateway");
    expect(failures, `unhealthy: ${failures.join(", ")}`).toEqual([]);
  });

  test("workspace health/run probes return a result per target", async ({ request }) => {
    const res = await request.post(`${APP_BASE_URLS.workspace}/api/health/run`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.results.length).toBe(body.total);
  });

  test("--json output shape: per-check status", async ({ request }) => {
    // The workspace /api/health endpoint returns JSON with product + timestamp.
    const res = await request.get(`${APP_BASE_URLS.workspace}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.product).toBe("standard-workspace");
    expect(json.timestamp).toBeTruthy();
  });
});
