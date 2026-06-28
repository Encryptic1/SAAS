import { RegexDashboardShell } from "@/components/regex-dashboard-shell";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <RegexDashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          <p className="text-sm ms-app-muted">Manage your Standard Regex subscription.</p>
        </div>
        <div className="ms-card p-4 space-y-2">
          <p className="text-sm">
            Free plan: up to <strong>10 patterns</strong> + access to the public library. Upgrade for unlimited private patterns, fork history, and the cheat sheet.
          </p>
          <a href="/api/billing/checkout" className="ms-btn inline-block">Upgrade to Starter — $9/mo</a>
        </div>
        <div className="ms-card p-4">
          <p className="text-sm font-semibold mb-2">Already subscribed?</p>
          <PortalButton />
        </div>
      </div>
    </RegexDashboardShell>
  );
}
