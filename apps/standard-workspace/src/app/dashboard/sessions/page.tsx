import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { SessionsList } from "@/components/sessions-list";
import { SessionLogViewer } from "@/components/session-log-viewer";
import { CreateSessionForm } from "@/components/create-session-form";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listSessions } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <WorkspaceDashboardShell><div>Sign in</div></WorkspaceDashboardShell>;

  const sessions = await listSessions(ownerId);
  const active = sessions.filter((s) => s.status === "running");
  const focused = active[0] ?? sessions[0] ?? null;

  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Workspace"
          title="Dev Sessions"
          subtitle="Start an ms-suite dev session and tail logs over SSE."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Sessions" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={active.length > 0 ? "success" : "neutral"} dot>
                {active.length} active
              </Badge>
              <Badge variant="neutral">{sessions.length} total</Badge>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Active sessions" value={String(active.length)} hint="Currently running" spark={active.map(() => 1)} sparkBinary />
          <KpiCard label="Total sessions" value={String(sessions.length)} hint="All time" spark={[Math.min(sessions.length, 10)]} sparkBinary />
          <KpiCard label="Crashed" value={String(sessions.filter((s) => s.status === "crashed").length)} hint="Needs attention" spark={sessions.filter((s) => s.status === "crashed").map(() => 0)} sparkBinary />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <SessionsList sessions={sessions} />
            {focused && (
              <div id={focused.id}>
                <h2 className="text-sm font-semibold uppercase opacity-60 mb-2">Live logs</h2>
                <SessionLogViewer session={focused} />
              </div>
            )}
          </div>
          <aside>
            <CreateSessionForm />
          </aside>
        </section>
      </div>
    </WorkspaceDashboardShell>
  );
}
