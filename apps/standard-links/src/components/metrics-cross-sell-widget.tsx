import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";

interface MetricsCrossSellWidgetProps {
  totalClicks: number;
  topLinkName: string | null;
  metricsUrl: string;
}

export function MetricsCrossSellWidget({
  totalClicks,
  topLinkName,
  metricsUrl,
}: MetricsCrossSellWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Want click-to-MRR attribution?</CardTitle>
        <CardDescription>
          Standard Metrics turns these clicks into MRR, ARR, churn, and LTV snapshots — pulling
          directly from your Stripe account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-[var(--text-mist)]">
          You&apos;ve recorded <strong className="text-[var(--text-foam)]">{totalClicks.toLocaleString()}</strong> total
          clicks{topLinkName ? ` across ${topLinkName}` : ""}. Connect Stripe on Standard Metrics to
          see which clicks converted to subscriptions.
        </p>
        <Link
          href={`${metricsUrl}/dashboard/settings`}
          className="ms-btn ms-btn-primary no-underline"
          target="_blank"
          rel="noreferrer"
        >
          Open Standard Metrics →
        </Link>
      </CardContent>
    </Card>
  );
}
