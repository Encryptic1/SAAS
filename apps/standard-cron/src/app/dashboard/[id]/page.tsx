import { CronDashboardShell } from "@/components/cron-dashboard-shell";
import { KpiCard, PageHeader, resolvePortfolioUrl } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { getJob } from "@/lib/cron-data";
import { describeCron } from "@/lib/cron-parser";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function statusBadge(status: string): string {
  if (status === "ok") return "ms-badge-success";
  if (status === "failed" || status === "missed") return "ms-badge-error";
  if (status === "running") return "ms-badge-info";
  return "ms-badge-neutral";
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return <CronDashboardShell><div>Sign in</div></CronDashboardShell>;
  const data = await getJob(id);
  if (!data || data.job.ownerId !== ownerId) notFound();
  const { job, runs } = data;

  const okRuns = runs.filter((r) => r.status === "ok").length;
  const failedRuns = runs.filter((r) => r.status === "failed" || r.status === "missed").length;
  const heartbeatUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? resolvePortfolioUrl("cron")}/api/heartbeat/${job.heartbeatToken}`;

  return (
    <CronDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Cron"
          title={job.name}
          subtitle={describeCron(job.scheduleCron)}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Jobs", href: "/dashboard" },
            { label: job.name },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Source" value={job.source} hint="Runner type" />
          <KpiCard label="Window" value={`${job.expectedWindowMinutes}m`} hint={`+ ${job.graceMinutes}m grace`} />
          <KpiCard label="Last status" value={job.lastStatus ?? "—"} hint={job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "No runs yet"} />
        </div>

        <div className="ms-card p-4 space-y-2">
          <p className="text-xs ms-app-muted uppercase tracking-wide">Heartbeat URL</p>
          <code className="block text-xs font-mono break-all">{heartbeatUrl}</code>
          <p className="text-xs ms-app-muted">
            Ping this URL at the start of each run:{" "}
            <code className="font-mono">curl -X POST {heartbeatUrl}</code>
          </p>
          <p className="text-xs ms-app-muted">
            Report a failure:{" "}
            <code className="font-mono">curl -X POST -H &quot;Content-Type: application/json&quot; -d &apos;&#123;&quot;status&quot;:&quot;failed&quot;&#125;&apos; {heartbeatUrl}</code>
          </p>
          {job.alertChannel && (
            <p className="text-xs ms-app-muted">Alerts → {job.alertChannel === "pulse" ? "Suite Pulse" : "Slack"}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold ms-app-muted uppercase tracking-wide">Run history</h2>
            <span className="text-xs ms-app-muted">{okRuns} ok · {failedRuns} failed · {runs.length} total</span>
          </div>
          {runs.length === 0 ? (
            <div className="ms-card p-6 text-center">
              <p className="text-sm ms-app-muted">No runs recorded yet. Ping the heartbeat URL to log the first one.</p>
            </div>
          ) : (
            <div className="ms-card p-0 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="ms-app-muted border-b border-[var(--hairline)]">
                  <tr>
                    <th className="text-left p-2">Started</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--hairline)] last:border-0">
                      <td className="p-2 whitespace-nowrap">{new Date(r.startedAt).toLocaleString()}</td>
                      <td className="p-2"><span className={`ms-badge ${statusBadge(r.status)} text-[10px]`}>{r.status}</span></td>
                      <td className="p-2 text-right font-mono">{r.durationMs != null ? `${r.durationMs}ms` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CronDashboardShell>
  );
}
