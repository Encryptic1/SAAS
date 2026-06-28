import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PoweredByBadge,
  StatCard,
} from "@market-standard/ui";
import { AnalyticsTrendChart } from "../../../components/analytics-trend-chart";
import { BreakdownChart } from "../../../components/breakdown-chart";
import {
  loadAnalytics,
  type AnalyticsPeriod,
  formatDelta,
} from "../../../lib/metrics-data";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  searchParams: Promise<{ period?: string }>;
}

const PERIODS: Array<{ id: AnalyticsPeriod; label: string }> = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "ytd", label: "Year to date" },
];

function isPeriod(v: string | undefined): v is AnalyticsPeriod {
  return v === "7d" || v === "30d" || v === "90d" || v === "ytd";
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const period: AnalyticsPeriod = isPeriod(params.period) ? params.period : "30d";
  const { account, current, previous, deltas, breakdown } = await loadAnalytics(period);

  const trendData = [...current]
    .reverse()
    .map((s) => ({
      date: s.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      mrr: s.mrr,
      arr: s.arr,
      activeSubscriptions: s.activeSubscriptions,
    }));

  const previousTrend = previous[0];
  const latest = current[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-dash-page-title">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Period-over-period comparison with product breakdown.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/analytics?period=${p.id}`}
            className={`ms-btn ms-btn-sm ${p.id === period ? "ms-btn-primary" : "ms-btn-ghost"}`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {!account && (
        <Card>
          <CardHeader>
            <CardTitle>No Stripe account connected</CardTitle>
            <CardDescription>
              Connect a Stripe account on the Settings page to start collecting analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings" className="ms-btn ms-btn-primary no-underline">
              Connect Stripe
            </Link>
          </CardContent>
        </Card>
      )}

      {account && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="MRR delta"
              value={deltas ? `$${deltas.mrr.toLocaleString()}` : "—"}
              trend={
                deltas
                  ? { value: formatDelta(latest?.mrr ?? 0, previousTrend?.mrr ?? 0).text, positive: deltas.mrr >= 0 }
                  : undefined
              }
            />
            <StatCard
              label="ARR delta"
              value={deltas ? `$${Math.round(deltas.arr).toLocaleString()}` : "—"}
              trend={
                deltas
                  ? { value: formatDelta(latest?.arr ?? 0, previousTrend?.arr ?? 0).text, positive: deltas.arr >= 0 }
                  : undefined
              }
            />
            <StatCard
              label="Sub delta"
              value={deltas ? `${deltas.activeSubscriptions >= 0 ? "+" : ""}${deltas.activeSubscriptions}` : "—"}
              trend={
                deltas
                  ? {
                      value: formatDelta(latest?.activeSubscriptions ?? 0, previousTrend?.activeSubscriptions ?? 0).text,
                      positive: deltas.activeSubscriptions >= 0,
                    }
                  : undefined
              }
            />
            <StatCard
              label="Churn delta"
              value={deltas ? `${(deltas.churnRate * 100).toFixed(2)}pp` : "—"}
              trend={
                deltas
                  ? {
                      value: formatDelta(latest?.churnRate ?? 0, previousTrend?.churnRate ?? 0, true).text,
                      positive: deltas.churnRate <= 0,
                    }
                  : undefined
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>MRR trend · {period}</CardTitle>
              <CardDescription>{current.length} snapshots in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsTrendChart data={trendData} metric="mrr" />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ARR trend</CardTitle>
                <CardDescription>Annualized run-rate trajectory</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsTrendChart data={trendData} metric="arr" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active subscriptions</CardTitle>
                <CardDescription>Subscription count over period</CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsTrendChart data={trendData} metric="activeSubscriptions" />
              </CardContent>
            </Card>
          </div>

          {breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Breakdown by product</CardTitle>
                <CardDescription>MRR and subscription counts aggregated from snapshot breakdowns</CardDescription>
              </CardHeader>
              <CardContent>
                <BreakdownChart data={breakdown} metric="mrr" />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-metrics" />
      </div>
    </div>
  );
}
