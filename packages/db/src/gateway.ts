const GATEWAY = process.env.DB_GATEWAY_URL ?? "http://127.0.0.1:4000";

export function isLocalGatewayMode(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
}

/**
 * Node's fetch (undici) on Windows can ETIMEDOUT on the first connection to
 * 127.0.0.1:4000 after the dev server starts or after idle time. A single
 * retry papers over this so the dev experience is reliable.
 */
async function fetchWithRetry(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (err instanceof Error && /ETIMEDOUT|ECONNRESET|fetch failed/i.test(err.message)) {
      // One retry after a short pause.
      await new Promise((r) => setTimeout(r, 200));
      return await fetch(url, init);
    }
    throw err;
  }
}

export async function fetchGateway<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${GATEWAY}${path}`);
  if (!res.ok) {
    throw new Error(`Gateway ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function postGateway<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchWithRetry(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway POST ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function patchGateway<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchWithRetry(`${GATEWAY}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway PATCH ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function deleteGateway<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${GATEWAY}${path}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gateway DELETE ${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
