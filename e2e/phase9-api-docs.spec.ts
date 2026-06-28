import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

const APPS = [
  { key: "polls", base: BASE.polls, title: "Standard Polls API" },
  { key: "proof", base: BASE.proof, title: "Standard Proof API" },
  { key: "metrics", base: BASE.metrics, title: "Standard Metrics API" },
  { key: "hook", base: BASE.hook, title: "Standard Hook API" },
  { key: "release", base: BASE.release, title: "Standard Release API" },
  { key: "vault", base: BASE.vault, title: "Standard Vault API" },
  { key: "links", base: BASE.links, title: "Standard Links API" },
  { key: "snippets", base: BASE.snippets, title: "Standard Snippets API" },
  { key: "status", base: BASE.status, title: "Standard Status API" },
  { key: "regex", base: BASE.regex, title: "Standard Regex API" },
  { key: "postmortem", base: BASE.postmortem, title: "Standard Postmortem API" },
  { key: "lens", base: BASE.lens, title: "Standard Lens API" },
  { key: "cron", base: BASE.cron, title: "Standard Cron API" },
] as const;

for (const app of APPS) {
  test(`${app.key}: GET /api/openapi.json returns valid OpenAPI 3.0 doc`, async ({ request }) => {
    const res = await request.get(`${app.base}/api/openapi.json`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.openapi).toMatch(/^3\./);
    expect(json.info?.title).toBe(app.title);
    expect(json.paths).toBeDefined();
    expect(Object.keys(json.paths).length).toBeGreaterThan(0);
    // Every app exposes /api/health
    expect(json.paths["/api/health"]).toBeDefined();
    expect(json.paths["/api/health"].get).toBeDefined();
  });

  test(`${app.key}: GET /api/docs serves Swagger UI HTML`, async ({ request }) => {
    const res = await request.get(`${app.base}/api/docs`);
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/html/i);
    const body = await res.text();
    expect(body).toContain("swagger-ui");
    expect(body).toContain("/api/openapi.json");
  });

  test(`${app.key}: GET /docs renders user docs page`, async ({ request }) => {
    const res = await request.get(`${app.base}/docs`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("docs");
    // Docs page should mention API endpoints or changelog
    expect(body.toLowerCase()).toMatch(/api|endpoint|changelog/);
  });
}
