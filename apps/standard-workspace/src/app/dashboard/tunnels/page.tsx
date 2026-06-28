import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { TunnelsList, CreateTunnelForm } from "@/components/tunnels-list";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listTunnels } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

export default async function TunnelsPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <WorkspaceDashboardShell><div>Sign in</div></WorkspaceDashboardShell>;

  const tunnels = await listTunnels(ownerId);
  const active = tunnels.filter((t) => t.status === "active");

  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Workspace"
          title="Webhook Tunnels"
          subtitle="Expose local intake routes to Stripe, Slack, and GitHub webhooks."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Tunnels" }]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Badge variant={active.length > 0 ? "success" : "neutral"} dot>
                {active.length} active
              </Badge>
              <Badge variant="neutral">{tunnels.length} total</Badge>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Active tunnels" value={String(active.length)} hint="Receiving webhooks" spark={active.map(() => 1)} sparkBinary />
          <KpiCard label="Total tunnels" value={String(tunnels.length)} hint="Configured" spark={[Math.min(tunnels.length, 10)]} sparkBinary />
          <KpiCard label="Errors" value={String(tunnels.filter((t) => t.status === "error").length)} hint="Needs attention" spark={tunnels.filter((t) => t.status === "error").map(() => 0)} sparkBinary />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <TunnelsList tunnels={tunnels} />
          <aside>
            <CreateTunnelForm />
          </aside>
        </section>
      </div>
    </WorkspaceDashboardShell>
  );
}
