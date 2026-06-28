import { StatusDashboardShell } from "@/components/status-dashboard-shell";
import { DeploymentsList } from "@/components/deployments-list";
import { getOwnerId } from "@/lib/owner";
import { getPipeline, deletePipeline } from "@/lib/status-data";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return <StatusDashboardShell><div>Sign in</div></StatusDashboardShell>;

  const result = await getPipeline(id);
  if (!result) notFound();
  const { pipeline, deployments } = result;

  async function handleDelete() {
    "use server";
    await deletePipeline(id);
  }

  return (
    <StatusDashboardShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs ms-app-muted hover:underline">← Back to dashboard</Link>
            <h1 className="text-2xl font-semibold mt-1">{pipeline.name}</h1>
            <p className="text-sm ms-app-muted">
              <span className="ms-badge ms-badge-neutral uppercase mr-2">{pipeline.source}</span>
              {pipeline.repoFullName ?? "—"}
            </p>
          </div>
          <form action={handleDelete}>
            <button type="submit" className="ms-btn-ghost text-xs ms-app-danger">Delete pipeline</button>
          </form>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="ms-card p-4">
            <p className="text-xs ms-app-muted">Last status</p>
            <p className="text-lg font-semibold capitalize">{pipeline.lastStatus ?? "—"}</p>
          </div>
          <div className="ms-card p-4">
            <p className="text-xs ms-app-muted">Last run</p>
            <p className="text-sm font-medium">
              {pipeline.lastRunAt ? new Date(pipeline.lastRunAt).toLocaleString() : "never"}
            </p>
          </div>
          <div className="ms-card p-4">
            <p className="text-xs ms-app-muted">Deployments logged</p>
            <p className="text-lg font-semibold">{deployments.length}</p>
          </div>
        </div>

        <DeploymentsList pipelineId={pipeline.id} deployments={deployments.map(d => ({ ...d }))} />
      </div>
    </StatusDashboardShell>
  );
}
