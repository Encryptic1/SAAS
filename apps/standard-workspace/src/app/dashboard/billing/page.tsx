import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm ms-app-muted">Manage your Standard Workspace subscription.</p>
        </div>
        <div className="ms-card p-4 space-y-2">
          <p className="text-sm">
            Free plan: <strong>1 user · 1 session</strong>. Upgrade for more sessions, webhook tunnels, and team seats.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/api/billing/checkout?tier=starter" className="ms-btn inline-block">Starter — $9/mo</a>
            <a href="/api/billing/checkout?tier=growth" className="ms-btn-primary inline-block">Growth — $29/mo</a>
          </div>
        </div>
        <div className="ms-card p-4">
          <p className="text-sm font-semibold mb-2">Already subscribed?</p>
          <PortalButton />
        </div>
      </div>
    </WorkspaceDashboardShell>
  );
}
