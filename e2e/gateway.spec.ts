import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

test.describe.configure({ mode: "serial" });

test("GET /health", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
});

test("GET /polls/stats", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/polls/stats`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.workspaces).toBeGreaterThanOrEqual(0);
  expect(json.polls).toBeGreaterThanOrEqual(0);
});

test("GET /polls/list", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/polls/list`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(Array.isArray(json)).toBe(true);
});

test("POST /polls/mock-install", async ({ request }) => {
  const res = await request.post(`${BASE.gateway}/polls/mock-install`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.workspace).toBeTruthy();
});

test("POST /polls", async ({ request }) => {
  const res = await request.post(`${BASE.gateway}/polls`, {
    data: {
      question: "Gateway E2E poll?",
      options: ["A", "B"],
    },
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.poll.question).toBe("Gateway E2E poll?");
});

test("GET /proof/collections", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/proof/collections`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.some((c: { slug: string }) => c.slug === "demo")).toBe(true);
});

test("GET /proof/collections/demo", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/proof/collections/demo`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.testimonials).toHaveLength(3);
});

test("GET /metrics/dashboard", async ({ request }) => {
  const res = await request.get(`${BASE.gateway}/metrics/dashboard`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.metrics).toBeTruthy();
  expect(json.metrics.mrr).toBe(12400);
  expect(json.metrics.activeSubscriptions).toBe(142);
});
