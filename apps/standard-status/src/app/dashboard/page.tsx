import { StatusDashboardShell } from "@/components/status-dashboard-shell";
import { CreatePipelineForm } from "@/components/create-pipeline-form";
import { PipelinesList } from "@/components/pipelines-list";
import { IncidentsList } from "@/components/incidents-list";
import { Badge, KpiCard, PageHeader, StatusBadge } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listPipelines, listIncidents } from "@/lib/status-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <StatusDashboardShell><div>Sign in</div></StatusDashboardShell>;

  const [pipelines, incidents] = await Promise.all([
    listPipelines(ownerId),
    listIncidents(ownerId),
  ]);

  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const successRate = computeSuccessRate(pipelines);
  const allRuns = collectRuns(pipelines);
  const recentRuns = allRuns.slice(-30);

  return (
    <StatusDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Status"
          title="Build & Deploy Health"
          subtitle="GitHub Actions · Vercel · FloodG8 runner — unified view."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{pipelines.length} pipelines</Badge>
              {activeIncidents.length > 0 ? (
                <Badge variant="danger" dot>{activeIncidents.length} active incident{activeIncidents.length === 1 ? "" : "s"}</Badge>
              ) : (
                <Badge variant="success" dot>All clear</Badge>
              )}
              <Badge variant={successRate >= 90 ? "success" : successRate >= 70 ? "warning" : "danger"}>
                30-run: {successRate}%
              </Badge>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Pipelines"
            value={String(pipelines.length)}
            hint="Connected CI sources"
            spark={[1, 1, 1, 1, 1, 1, 1].slice(0, Math.max(pipelines.length, 1))}
            sparkBinary
          />
          <KpiCard
            label="Active incidents"
            value={String(activeIncidents.length)}
            hint={activeIncidents.length > 0 ? "Needs triage" : "No open incidents"}
            spark={activeIncidents.map(() => 0)}
            sparkBinary
          />
          <KpiCard
            label="30-run success"
            value={`${successRate}%`}
            hint={`${allRuns.length} total runs`}
            spark={recentRuns.map((r) => (r.status === "success" || r.status === "ready" ? 1 : 0))}
            sparkBinary
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <PipelinesList pipelines={pipelines.map(p => ({ ...p, last30Runs: p.last30Runs as Array<{ status: string; at: string }> | null }))} />
            <IncidentsList incidents={incidents.map(i => ({ ...i }))} />
          </div>
          <aside className="space-y-4">
            <CreatePipelineForm />
            <div className="ms-card p-4 space-y-2 text-xs">
              <p className="font-semibold text-sm">Intake webhook</p>
              <p className="ms-app-muted">
                POST <code className="ms-code">/api/intake</code> with <code className="ms-code">Authorization: Bearer $STATUS_INTAKE_SECRET</code>.
              </p>
              <p className="ms-app-muted">
                Unified body: <code className="ms-code">{"{ source, event, ownerId, status, ... }"}</code>.
                GitHub workflow_run → pipeline. Vercel deployment → deployment. FloodG8 runner → pipeline.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </StatusDashboardShell>
  );
}

function computeSuccessRate(pipelines: Array<{ last30Runs: Array<{ status: string; at: string }> | null }>): number {
  let total = 0;
  let success = 0;
  for (const p of pipelines) {
    for (const r of p.last30Runs ?? []) {
      total += 1;
      if (r.status === "success" || r.status === "ready") success += 1;
    }
  }
  if (total === 0) return 100;
  return Math.round((success / total) * 100);
}

function collectRuns(pipelines: Array<{ last30Runs: Array<{ status: string; at: string }> | null }>): Array<{ status: string; at: string }> {
  const all: Array<{ status: string; at: string }> = [];
  for (const p of pipelines) {
    if (p.last30Runs) all.push(...p.last30Runs);
  }
  return all.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
