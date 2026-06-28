import { expect, test } from "@playwright/test";
import { collectPageErrors, expectNoErrors } from "./helpers";

/**
 * Suite Pulse (FloodG8) e2e — verifies the portfolio hub loads and the
 * agent-report intake endpoint accepts a report.
 *
 * FloodG8 runs on its own dev server (default http://localhost:3000 in the
 * floodg8 workspace). These tests are gated on FLOODG8_BASE being set so they
 * don't fail when FloodG8 isn't running locally. In CI we set FLOODG8_BASE
 * to the deployed staging URL.
 */
const FLOODG8_BASE = process.env.FLOODG8_BASE ?? process.env.FLOODG8_E2E_BASE ?? "";
const hasFloodg8 = Boolean(FLOODG8_BASE);

test.describe("Suite Pulse (FloodG8) — portfolio + agent report", () => {
  test.skip(!hasFloodg8, "FLOODG8_BASE not set");

  test("portfolio hub loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${FLOODG8_BASE}/portfolio`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/portfolio|floodg8|standard/i);
    expectNoErrors(errors, "FloodG8 portfolio");
  });

  test("agent report intake accepts a POST", async ({ request }) => {
    const res = await request.post(`${FLOODG8_BASE}/api/portfolio/agent-report`, {
      data: {
        agentId: "e2e-test-agent",
        sessionId: `e2e-${Date.now()}`,
        report: {
          summary: "E2E test report from Playwright",
          tokens: { input: 100, output: 200 },
          costUsd: 0.0042,
        },
      },
    });
    // Accept 200 or 201; a 4xx without auth is also acceptable if the route
    // is gated. A 500 means the route crashed.
    expect(res.status(), "agent-report should not 500").toBeLessThan(500);
  });
});
