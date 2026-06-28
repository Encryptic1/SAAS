import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { buildTargetList } from "@/components/health-grid";
import { runHealthProbes } from "@/lib/health-probes";
import { recordHealthCheck } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export async function POST() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targets = buildTargetList();
  const results = await runHealthProbes(targets);

  await Promise.all(
    results.map((r) =>
      r.status !== "unknown"
        ? recordHealthCheck({
            ownerId,
            target: r.target,
            url: r.url,
            status: r.status,
            latencyMs: r.latencyMs,
            detail: r.detail,
          }).catch(() => undefined)
        : Promise.resolve(),
    ),
  );

  const ok = results.filter((r) => r.status === "ok").length;
  return NextResponse.json({ results, ok, total: results.length });
}
