import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { HealthGrid, buildTargetList } from "@/components/health-grid";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listHealthChecks } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <WorkspaceDashboardShell><div>Sign in</div></WorkspaceDashboardShell>;

  const checks = await listHealthChecks(ownerId);
  const targets = buildTargetList();
  const okCount = checks.filter((c, i, arr) => arr.findIndex((x) => x.target === c.target) === i && c.status === "ok").length;

  // Group by target for a per-target summary
  const byTarget = new Map<string, typeof checks>();
  for (const c of checks) {
    const arr = byTarget.get(c.target) ?? [];
    arr.push(c);
    byTarget.set(c.target, arr);
  }

  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Workspace"
          title="Health History"
          subtitle="Latency + downtime per target over time."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Health" }]}
          actions={
            <Badge variant={okCount === targets.length ? "success" : "warning"} dot>
              {okCount}/{targets.length} healthy
            </Badge>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Stored checks" value={String(checks.length)} hint="All probes" spark={[Math.min(checks.length, 10)]} sparkBinary />
          <KpiCard label="Targets" value={String(targets.length)} hint="Apps + externals" spark={[targets.length]} sparkBinary />
          <KpiCard label="Down events" value={String(checks.filter((c) => c.status === "down").length)} hint="Unreachable probes" spark={checks.filter((c) => c.status === "down").map(() => 0)} sparkBinary />
        </div>

        <HealthGrid checks={checks} />

        <section>
          <h2 className="text-sm font-semibold uppercase opacity-60 mb-3">Recent checks</h2>
          <div className="ms-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase opacity-60">
                <tr>
                  <th className="p-3">Target</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Checked</th>
                  <th className="p-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 40).map((c) => (
                  <tr key={c.id} className="border-t border-[var(--hairline)]">
                    <td className="p-3 font-mono text-xs">{c.target}</td>
                    <td className="p-3">
                      <Badge variant={c.status === "ok" ? "success" : c.status === "degraded" ? "warning" : "danger"} dot>{c.status}</Badge>
                    </td>
                    <td className="p-3 text-xs opacity-70">{c.latencyMs != null ? `${c.latencyMs}ms` : "—"}</td>
                    <td className="p-3 text-xs opacity-70">{new Date(c.checkedAt).toLocaleString()}</td>
                    <td className="p-3 text-xs opacity-60">{c.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </WorkspaceDashboardShell>
  );
}
