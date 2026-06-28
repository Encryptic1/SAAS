import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { PortalButton } from "@/components/portal-button";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <SnippetsDashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="ms-dash-h1">Billing</h1>
          <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
            Manage your Standard Snippets subscription via Stripe.
          </p>
        </header>
        <section className="ms-card p-4 space-y-3">
          <h3 className="font-semibold">Manage subscription</h3>
          <p className="text-sm text-[var(--text-mist)]">
            Update payment method, change plans, or cancel via the Stripe customer portal.
          </p>
          <PortalButton />
        </section>
      </div>
    </SnippetsDashboardShell>
  );
}
