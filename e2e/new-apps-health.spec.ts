import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

test("Hook GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.hook}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-hook");
});

test("Release GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.release}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-release");
});

test("Vault GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.vault}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-vault");
});

test("Links GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.links}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-links");
});

test("Snippets GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.snippets}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-snippets");
});

test("Status GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.status}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-status");
});

test("Regex GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.regex}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-regex");
});

test("Postmortem GET /api/health", async ({ request }) => {
  const res = await request.get(`${BASE.postmortem}/api/health`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.status).toBe("ok");
  expect(json.product).toBe("standard-postmortem");
});
