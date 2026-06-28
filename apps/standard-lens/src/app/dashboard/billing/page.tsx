import { LensDashboardShell } from "@/components/lens-dashboard-shell";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <LensDashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm ms-app-muted">Manage your Standard Lens subscription.</p>
        </div>
        <div className="ms-card p-4 space-y-2">
          <p className="text-sm">
            Free plan: <strong>100 queries/day</strong> + 7-day slow-query history. Upgrade for unlimited saved queries, full history, and Slack alerts.
          </p>
          <a href="/api/billing/checkout" className="ms-btn inline-block">Upgrade to Starter — $29/mo</a>
        </div>
        <div className="ms-card p-4">
          <p className="text-sm font-semibold mb-2">Already subscribed?</p>
          <PortalButton />
        </div>
      </div>
    </LensDashboardShell>
  );
}
