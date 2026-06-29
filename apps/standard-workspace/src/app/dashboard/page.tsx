import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { HealthGrid, buildTargetList } from "@/components/health-grid";
import { Badge, KpiCard, PageHeader, getPortfolioUrls } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listSessions, listHealthChecks, listTunnels } from "@/lib/workspace-data";
import { runHealthProbes } from "@/lib/health-probes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <WorkspaceDashboardShell><div>Sign in</div></WorkspaceDashboardShell>;

  const portfolioUrls = getPortfolioUrls();

  // Probe live health on every dashboard load (best-effort, non-blocking)
  const targets = buildTargetList();
  const probeResults = await runHealthProbes(targets);
  await Promise.all(
    probeResults.map((r) =>
      r.status !== "unknown"
        ? recordHealth(ownerId, r.target, r.url, r.status, r.latencyMs, r.detail)
        : Promise.resolve(),
    ),
  );

  const [sessions, checks, tunnels] = await Promise.all([
    listSessions(ownerId),
    listHealthChecks(ownerId),
    listTunnels(ownerId),
  ]);

  const activeSessions = sessions.filter((s) => s.status === "running");
  const activeTunnels = tunnels.filter((t) => t.status === "active");
  const okCount = probeResults.filter((r) => r.status === "ok").length;
  const totalCount = probeResults.length;

  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Workspace"
          title="Portfolio Control Panel"
          subtitle="14 apps + FloodG8 + SyncDevTime + Supabase + Stripe — one pane."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={okCount === totalCount ? "success" : okCount >= totalCount - 2 ? "warning" : "danger"} dot>
                {okCount}/{totalCount} healthy
              </Badge>
              <Badge variant="neutral">{activeSessions.length} session{activeSessions.length === 1 ? "" : "s"}</Badge>
              <Badge variant="neutral">{activeTunnels.length} tunnel{activeTunnels.length === 1 ? "" : "s"}</Badge>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard
            label="Apps healthy"
            value={`${okCount}/${totalCount}`}
            hint="Live /api/health + externals"
            spark={probeResults.map((r) => (r.status === "ok" ? 1 : 0))}
            sparkBinary
          />
          <KpiCard
            label="Active sessions"
            value={String(activeSessions.length)}
            hint={activeSessions.length > 0 ? "Tailing logs" : "No running sessions"}
            spark={activeSessions.map(() => 1)}
            sparkBinary
          />
          <KpiCard
            label="Active tunnels"
            value={String(activeTunnels.length)}
            hint="Inbound webhook routes"
            spark={activeTunnels.map(() => 1)}
            sparkBinary
          />
          <KpiCard
            label="Health checks"
            value={String(checks.length)}
            hint="Stored probe history"
            spark={[Math.min(checks.length, 10)]}
            sparkBinary
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase opacity-60 mb-3">Status grid</h2>
          <HealthGrid checks={checks} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase opacity-60">Quick links</h2>
            <div className="ms-card p-4 grid gap-2 text-sm">
              <a className="ms-app-link" href="/dashboard/sessions">Dev sessions → tail logs over SSE</a>
              <a className="ms-app-link" href="/dashboard/tunnels">Webhook tunnels → Cloudflare / localhost</a>
              <a className="ms-app-link" href="/dashboard/health">Health history → latency + downtime</a>
              <a className="ms-app-link" href="/dashboard/depsync">Depsync → package parity diff</a>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="ms-card p-4 space-y-2 text-xs">
              <p className="font-semibold text-sm">Cross-suite</p>
              <p className="ms-app-muted">
                Jump to <a className="ms-app-link" href={portfolioUrls.status}>Standard Status</a> for build health,
                <a className="ms-app-link" href={portfolioUrls.snippets}> Snippets</a> for runbooks,
                <a className="ms-app-link" href={portfolioUrls.vault}> Vault</a> for secrets.
              </p>
            </div>
            <div className="ms-card p-4 space-y-2 text-xs">
              <p className="font-semibold text-sm">API quick start</p>
              <p className="ms-app-muted">
                <code className="ms-code">POST /api/sessions</code> to start a session.
                Tail logs at <code className="ms-code">GET /api/sessions/[id]/logs</code> (SSE).
              </p>
              <p className="ms-app-muted">
                <code className="ms-code">POST /api/health/run</code> to re-probe all targets.
                <code className="ms-code">GET /api/depsync</code> for package parity.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </WorkspaceDashboardShell>
  );
}

import { recordHealthCheck } from "@/lib/workspace-data";

async function recordHealth(
  ownerId: string,
  target: string,
  url: string,
  status: string,
  latencyMs: number | null,
  detail: string | null,
) {
  try {
    await recordHealthCheck({ ownerId, target, url, status, latencyMs, detail });
  } catch {
    // non-blocking — health probes are best-effort
  }
}
