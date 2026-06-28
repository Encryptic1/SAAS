import { CronDashboardShell } from "@/components/cron-dashboard-shell";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <CronDashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm ms-app-muted">Manage your Standard Cron subscription.</p>
        </div>
        <div className="ms-card p-4 space-y-2">
          <p className="text-sm">
            Free plan: <strong>3 monitored jobs</strong> + 7-day run history. Upgrade for more jobs, full history, and Slack alerts.
          </p>
          <a href="/api/billing/checkout" className="ms-btn inline-block">Upgrade to Starter — $19/mo</a>
        </div>
        <div className="ms-card p-4">
          <p className="text-sm font-semibold mb-2">Already subscribed?</p>
          <PortalButton />
        </div>
      </div>
    </CronDashboardShell>
  );
}
