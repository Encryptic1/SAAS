import { StatusDashboardShell } from "@/components/status-dashboard-shell";
import { CreatePipelineForm } from "@/components/create-pipeline-form";
import { PipelinesList } from "@/components/pipelines-list";
import { IncidentsList } from "@/components/incidents-list";
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

  const activeIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const successRate = computeSuccessRate(pipelines);

  return (
    <StatusDashboardShell>
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Build &amp; Deploy Health</h1>
            <p className="text-sm ms-app-muted">
              GitHub Actions · Vercel · FloodG8 runner — unified view.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="ms-badge ms-badge-neutral">{pipelines.length} pipelines</span>
            <span className={`ms-badge ${activeIncidents > 0 ? "ms-badge-strong ms-status-failed" : "ms-badge-strong ms-status-success"}`}>
              {activeIncidents} active incidents
            </span>
            <span className="ms-badge ms-badge-neutral">30-run success: {successRate}%</span>
          </div>
        </header>

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
