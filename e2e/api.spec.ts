import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

test("Polls GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.polls}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-polls");
  expect(json.db).toBe("ok");
});

test("Proof GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.proof}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-proof");
});

test("Metrics GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.metrics}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-metrics");
});

test("Proof GET /api/embed/demo.js", async ({ request }) => {
  const res = await request.get(`${BASE.proof}/api/embed/demo.js`);
  expect(res.status()).toBe(200);
  const ct = res.headers()["content-type"] ?? "";
  expect(ct).toMatch(/javascript|ecmascript/i);
  const body = await res.text();
  expect(body).toContain('data-proof-collection="demo"');
  expect(body).toContain("/embed/demo");
});
