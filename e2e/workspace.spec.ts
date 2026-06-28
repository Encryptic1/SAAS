import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Workspace — portfolio control panel", () => {
  test("marketing home loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/portfolio control panel|one pane/i);
    expectNoErrors(errors, "Workspace home");
  });

  test("dashboard loads with status grid", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/portfolio control panel|status grid/i);
    expectNoErrors(errors, "Workspace dashboard");
  });

  test("sessions dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/dashboard/sessions`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/dev session/i);
    expectNoErrors(errors, "Workspace sessions");
  });

  test("tunnels dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/dashboard/tunnels`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/tunnel/i);
    expectNoErrors(errors, "Workspace tunnels");
  });

  test("health dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/dashboard/health`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/health/i);
    expectNoErrors(errors, "Workspace health");
  });

  test("depsync dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/dashboard/depsync`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/parity|depsync/i);
    expectNoErrors(errors, "Workspace depsync");
  });

  test("sessions API can create + list + stop a session", async ({ request }) => {
    const createRes = await request.post(`${BASE.workspace}/api/sessions`, {
      data: { label: `E2E session ${Date.now()}`, apps: "standard-polls,standard-proof" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.session.id).toBeTruthy();
    expect(created.session.status).toBe("running");

    const listRes = await request.get(`${BASE.workspace}/api/sessions`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.sessions.some((s: { id: string }) => s.id === created.session.id)).toBeTruthy();

    const stopRes = await request.post(`${BASE.workspace}/api/sessions/${created.session.id}/stop`);
    expect(stopRes.status()).toBe(200);
    const stopped = await stopRes.json();
    expect(stopped.session.status).toBe("stopped");
  });

  test("tunnels API can create + list + delete a tunnel", async ({ request }) => {
    const createRes = await request.post(`${BASE.workspace}/api/tunnels`, {
      data: { name: `E2E tunnel ${Date.now()}`, targetApp: "standard-hook", targetPath: "/api/capture", provider: "cloudflare" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.tunnel.id).toBeTruthy();

    const listRes = await request.get(`${BASE.workspace}/api/tunnels`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.tunnels.some((t: { id: string }) => t.id === created.tunnel.id)).toBeTruthy();

    const delRes = await request.delete(`${BASE.workspace}/api/tunnels/${created.tunnel.id}`);
    expect(delRes.status()).toBe(200);
  });

  test("depsync API returns a parity report", async ({ request }) => {
    const res = await request.get(`${BASE.workspace}/api/depsync`);
    expect(res.status()).toBe(200);
    const report = await res.json();
    expect(report.packages).toBeInstanceOf(Array);
    expect(report.divergent).toBeInstanceOf(Array);
    expect(report.generatedAt).toBeTruthy();
  });

  test("health/run API probes targets", async ({ request }) => {
    const res = await request.post(`${BASE.workspace}/api/health/run`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.results).toBeInstanceOf(Array);
  });

  test("openapi.json is served", async ({ request }) => {
    const res = await request.get(`${BASE.workspace}/api/openapi.json`);
    expect(res.status()).toBe(200);
    const doc = await res.json();
    expect(doc.openapi).toBe("3.0.3");
    expect(doc.info.title).toMatch(/workspace/i);
  });

  test("docs page loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.workspace}/docs`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/workspace|portfolio/i);
    expectNoErrors(errors, "Workspace docs");
  });
});
