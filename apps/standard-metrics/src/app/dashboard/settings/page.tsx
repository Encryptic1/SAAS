import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PoweredByBadge,
} from "@market-standard/ui";
import { SettingsPanel } from "../../../components/settings-panel";
import { loadQuotaSnapshots, loadMetricsOverview } from "../../../lib/metrics-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [{ account }, overview] = await Promise.all([
    loadQuotaSnapshots(),
    loadMetricsOverview(),
  ]);

  const connected = Boolean(account || overview.accountId);
  const stripeAccountId = account?.stripeAccountId ?? overview.accountId ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-dash-page-title">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Manage your Stripe Connect integration, snapshot frequency, and account preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Connect</CardTitle>
          <CardDescription>
            Read-only access to your Stripe account for MRR, churn, and LTV reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsPanel connected={connected} stripeAccountId={stripeAccountId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook endpoint</CardTitle>
          <CardDescription>Register this URL in your Stripe dashboard to receive event updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="ms-app-pre block">
            {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003"}/api/webhooks/stripe
          </code>
          <p className="mt-2 text-xs text-[var(--text-mist)]">
            Events signed by your <code>STRIPE_WEBHOOK_SECRET</code> are accepted. Snapshot sync runs on the cron schedule below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync schedule</CardTitle>
          <CardDescription>Daily snapshot runs at 09:00 UTC via the suite cron.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-[var(--text-mist)]">
            <li>· MRR / ARR / active subscriptions — pulled from <code>Balance</code> + <code>Subscriptions</code> APIs</li>
            <li>· Churn rate — derived from canceled subscriptions in the trailing 30 days</li>
            <li>· LTV — average customer value over the trailing 90 days</li>
            <li>· Breakdown — grouped by product metadata on prices</li>
          </ul>
          <p className="mt-3">
            <Link href="/dashboard/analytics" className="ms-app-link text-sm">
              View analytics →
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-metrics" />
      </div>
    </div>
  );
}
