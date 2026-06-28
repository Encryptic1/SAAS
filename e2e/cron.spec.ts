import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

test.describe("Standard Cron — monitor + heartbeat", () => {
  test("dashboard loads", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.cron}/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/monitored job|register a job/i);
    expectNoErrors(errors, "Cron dashboard");
  });

  test("jobs API rejects an invalid cron expression", async ({ request }) => {
    const res = await request.post(`${BASE.cron}/api/jobs`, {
      data: { name: "Bad schedule", scheduleCron: "not a cron" },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/cron/i);
  });

  test("jobs API can create + list + detail + delete a job", async ({ request }) => {
    const createRes = await request.post(`${BASE.cron}/api/jobs`, {
      data: {
        name: `E2E job ${Date.now()}`,
        scheduleCron: "0 9 * * 1-5",
        source: "vercel",
        expectedWindowMinutes: 5,
        graceMinutes: 2,
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.job.id).toBeTruthy();
    expect(created.job.heartbeatToken).toBeTruthy();

    const listRes = await request.get(`${BASE.cron}/api/jobs`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.jobs.some((j: { id: string }) => j.id === created.job.id)).toBeTruthy();

    const detailRes = await request.get(`${BASE.cron}/api/jobs/${created.job.id}`);
    expect(detailRes.status()).toBe(200);
    const detail = await detailRes.json();
    expect(detail.job.name).toBe(created.job.name);

    const delRes = await request.delete(`${BASE.cron}/api/jobs/${created.job.id}`);
    expect(delRes.status()).toBe(200);
  });

  test("heartbeat URL records a run", async ({ request }) => {
    const createRes = await request.post(`${BASE.cron}/api/jobs`, {
      data: { name: `Heartbeat job ${Date.now()}`, scheduleCron: "*/5 * * * *", source: "custom" },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const token = created.job.heartbeatToken;

    const pingRes = await request.post(`${BASE.cron}/api/heartbeat/${token}`, {
      data: { status: "ok", durationMs: 1200 },
    });
    expect(pingRes.status()).toBe(201);
    const ping = await pingRes.json();
    expect(ping.ok).toBe(true);
    expect(ping.run.status).toBe("ok");

    const detailRes = await request.get(`${BASE.cron}/api/jobs/${created.job.id}`);
    const detail = await detailRes.json();
    expect(detail.runs.length).toBeGreaterThanOrEqual(1);
    expect(detail.job.lastStatus).toBe("ok");

    await request.delete(`${BASE.cron}/api/jobs/${created.job.id}`);
  });

  test("heartbeat rejects an unknown token", async ({ request }) => {
    const res = await request.post(`${BASE.cron}/api/heartbeat/definitely-not-a-real-token`, {
      data: { status: "ok" },
    });
    expect(res.status()).toBe(404);
  });

  test("job detail page renders heartbeat URL + run history", async ({ page, request }) => {
    const createRes = await request.post(`${BASE.cron}/api/jobs`, {
      data: { name: `Detail page job ${Date.now()}`, scheduleCron: "0 0 * * *", source: "github" },
    });
    const created = await createRes.json();
    await request.post(`${BASE.cron}/api/heartbeat/${created.job.heartbeatToken}`, {
      data: { status: "ok" },
    });

    const errors = collectPageErrors(page);
    await page.goto(`${BASE.cron}/dashboard/${created.job.id}`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(/heartbeat url/i);
    await expect(page.locator("body")).toContainText(/run history/i);
    expectNoErrors(errors, "Cron job detail");

    await request.delete(`${BASE.cron}/api/jobs/${created.job.id}`);
  });
});
