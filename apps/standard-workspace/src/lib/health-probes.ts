/**
 * Live health probes for the workspace status grid.
 * Pings each target's health URL with a short timeout and returns
 * status (ok | degraded | down) + latency. Best-effort — never throws.
 */

export type ProbeTarget = {
  target: string;
  label: string;
  url: string;
  href?: string;
};

export type ProbeResult = {
  target: string;
  url: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs: number | null;
  detail: string | null;
};

const TIMEOUT_MS = 4000;
const DEGRADED_MS = 1500;

export async function runHealthProbes(targets: ProbeTarget[]): Promise<ProbeResult[]> {
  return Promise.all(targets.map((t) => probeOne(t)));
}

async function probeOne(t: ProbeTarget): Promise<ProbeResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(t.url, {
      method: "GET",
      signal: controller.signal,
      headers: { "user-agent": "standard-workspace/health-probe" },
      cache: "no-store",
    });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      return {
        target: t.target,
        url: t.url,
        status: latencyMs > DEGRADED_MS ? "degraded" : "ok",
        latencyMs,
        detail: null,
      };
    }
    return {
      target: t.target,
      url: t.url,
      status: "degraded",
      latencyMs,
      detail: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      target: t.target,
      url: t.url,
      status: "down",
      latencyMs: null,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }
}
