import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PoweredByBadge,
} from "@market-standard/ui";
import { QuotaManager } from "../../../components/quota-manager";
import { loadQuotaSnapshots } from "../../../lib/metrics-data";

export const dynamic = "force-dynamic";

export default async function QuotaPage() {
  const { account, latest } = await loadQuotaSnapshots();
  const totalSamples = latest.reduce((acc, g) => acc + g.samples.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-dash-page-title">Quota Monitor</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Track rate-limit usage across Stripe, Slack, GitHub, Supabase, OpenAI, Anthropic, Vercel, and Resend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected sources</CardTitle>
          <CardDescription>
            {account ? `Recording for ${account.stripeAccountId}` : "No Stripe account bound — samples will still record."}{" "}
            {totalSamples} sample(s) across {latest.length} source(s).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latest.length === 0 ? (
            <EmptyState
              title="No quota samples yet"
              description="Use the form below to record a manual sample, or wire a cron to POST to /api/quota."
            />
          ) : (
            <QuotaManager initial={latest} />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-metrics" />
      </div>
    </div>
  );
}
