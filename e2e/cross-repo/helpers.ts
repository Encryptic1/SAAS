/**
 * Phase 12: cross-repo helpers. These wrap the cross-app flows that the 18
 * spec scenarios exercise. Each helper is safe to call against the local dev
 * stack; helpers that touch external services (FloodG8, SyncDevTime) probe
 * availability first and return null when the service is unreachable so the
 * calling spec can skip.
 */
import { APP_BASE_URLS, type ExternalService } from "./fixtures";

/** Ping an app's /api/health (or the gateway's /health) and return true if it responds 200. */
export async function appHealthy(app: string): Promise<boolean> {
  const base = APP_BASE_URLS[app];
  if (!base) return false;
  const healthPath = app === "gateway" ? "/health" : "/api/health";
  try {
    const res = await fetch(`${base}${healthPath}`, { signal: AbortSignal.timeout(6_000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Wait for an app to become healthy, polling up to timeoutMs. */
export async function waitForApp(app: string, timeoutMs = 60_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await appHealthy(app)) return true;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  return false;
}

const externalCache = new Map<ExternalService, boolean>();

/** Probe an external service once and cache the result for the run. */
export async function externalAvailable(service: ExternalService): Promise<boolean> {
  if (externalCache.has(service)) return externalCache.get(service)!;
  let ok = false;
  try {
    const url = APP_BASE_URLS[service];
    if (!url) {
      ok = false;
    } else {
      // Any HTTP response (even a redirect/401) means the host is reachable.
      // A network error throws and lands in the catch block.
      await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(8_000),
        redirect: "manual",
      });
      ok = true;
    }
  } catch {
    ok = false;
  }
  externalCache.set(service, ok);
  return ok;
}

/** Fetch the FloodG8 portfolio catalog (17 products). Returns null if FloodG8 is unreachable. */
export async function fetchFloodG8Catalog(): Promise<Array<{ id: string; name: string; tagline: string; url: string }> | null> {
  if (!(await externalAvailable("floodg8"))) return null;
  try {
    const res = await fetch(`${APP_BASE_URLS.floodg8}/api/portfolio/catalog`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { products?: Array<{ id: string; name: string; tagline: string; url: string }> };
    return json.products ?? null;
  } catch {
    return null;
  }
}

/** POST an agent report to FloodG8. Returns the created report or null. */
export async function postAgentReport(payload: { title: string; body?: string }): Promise<{ id: string } | null> {
  if (!(await externalAvailable("floodg8"))) return null;
  try {
    const res = await fetch(`${APP_BASE_URLS.floodg8}/api/portfolio/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string };
  } catch {
    return null;
  }
}

/** Poll a Supabase row via the gateway until predicate matches. Local-dev only. */
export async function pollSupabaseRow<T>(
  query: () => Promise<T | null>,
  predicate: (row: T) => boolean,
  timeoutMs = 15_000,
): Promise<T | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const row = await query();
      if (row && predicate(row)) return row;
    } catch {
      // ignore transient
    }
    await new Promise((r) => setTimeout(r, 1_500));
  }
  return null;
}

/** Mint an SSO code for cross-app auth (FloodG8 → Standard apps). Stub in local dev. */
export async function mintSSOCode(userId: string, targetApp: string): Promise<string | null> {
  if (!(await externalAvailable("floodg8"))) return null;
  try {
    const res = await fetch(`${APP_BASE_URLS.floodg8}/api/sso/mint`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, targetApp }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { code?: string };
    return json.code ?? null;
  } catch {
    return null;
  }
}

/** Build a deep-link URL between two apps with query params. */
export function deepLink(fromApp: string, toApp: string, path: string, params?: Record<string, string>): string {
  const base = APP_BASE_URLS[toApp];
  const url = new URL(path, base);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  url.searchParams.set("from", fromApp);
  return url.toString();
}

/** POST a webhook event to Hook's capture endpoint. */
export async function postHookEvent(slug: string, body: unknown, status = 200): Promise<Response> {
  return fetch(`${APP_BASE_URLS.hook}/api/capture/${slug}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-status": String(status) },
    body: JSON.stringify(body),
  });
}

/** POST an intake event to Status (simulated GitHub workflow_run). */
export async function postStatusIntake(event: Record<string, unknown>): Promise<Response> {
  return fetch(`${APP_BASE_URLS.status}/api/intake`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: "github", event: "workflow_run", ownerId: "local-dev", ...event }),
  });
}

/** Start a workspace dev session and return its id. */
export async function startWorkspaceSession(label: string, apps: string): Promise<string | null> {
  const res = await fetch(`${APP_BASE_URLS.workspace}/api/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label, apps }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { session?: { id: string } };
  return json.session?.id ?? null;
}

/** Stop a workspace dev session. */
export async function stopWorkspaceSession(id: string): Promise<boolean> {
  const res = await fetch(`${APP_BASE_URLS.workspace}/api/sessions/${id}/stop`, { method: "POST" });
  return res.ok;
}
