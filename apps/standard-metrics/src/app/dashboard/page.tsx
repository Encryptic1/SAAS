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
import { MetricsTrendChart } from "../../components/metrics-trend-chart";
import { formatDelta, loadMetricsOverview } from "../../lib/metrics-data";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ connected?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const connected = params.connected === "true" || process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
  const { latest, previous, series, accountId } = await loadMetricsOverview();

  const chartData = [...series].reverse().map((s) => ({
    date: s.snapshotDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    mrr: s.mrr,
    arr: s.arr,
  }));

  const mrrDelta = latest && previous ? formatDelta(latest.mrr, previous.mrr) : undefined;
  const arrDelta = latest && previous ? formatDelta(latest.arr, previous.arr) : undefined;
  const churnDelta =
    latest && previous ? formatDelta(latest.churnRate * 100, previous.churnRate * 100, true) : undefined;
  const ltvDelta = latest && previous ? formatDelta(latest.ltv, previous.ltv) : undefined;
  const subsDelta =
    latest && previous
      ? formatDelta(latest.activeSubscriptions, previous.activeSubscriptions)
      : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-dash-page-title">Overview</h1>
        {connected && latest && (
          <p className="mt-2 text-sm text-[var(--color-flood)]">
            {process.env.NEXT_PUBLIC_LOCAL_DEV === "true"
              ? "Showing seeded PGlite metrics (local dev)."
              : "Stripe account connected successfully."}
          </p>
        )}
        {!latest && process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && (
          <p className="mt-2 text-sm text-[var(--color-caution)]">
            No metrics yet — run <code className="ms-app-pre inline px-1 py-0.5">pnpm db:setup</code> and ensure the
            gateway is running.
          </p>
        )}
        {latest && (
          <p className="mt-1 text-xs text-[var(--text-mist)]">
            Latest snapshot: {latest.snapshotDate.toLocaleString()}
            {accountId ? ` · ${accountId}` : ""}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="MRR"
          value={latest ? `$${latest.mrr.toLocaleString()}` : "—"}
          trend={mrrDelta ? { value: mrrDelta.text, positive: mrrDelta.positive } : undefined}
        />
        <StatCard
          label="ARR"
          value={latest ? `$${latest.arr.toLocaleString()}` : "—"}
          trend={arrDelta ? { value: arrDelta.text, positive: arrDelta.positive } : undefined}
        />
        <StatCard
          label="Churn"
          value={latest ? `${(latest.churnRate * 100).toFixed(1)}%` : "—"}
          trend={churnDelta ? { value: churnDelta.text, positive: churnDelta.positive } : undefined}
        />
        <StatCard
          label="LTV"
          value={latest ? `$${Math.round(latest.ltv).toLocaleString()}` : "—"}
          trend={ltvDelta ? { value: ltvDelta.text, positive: ltvDelta.positive } : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MRR trend</CardTitle>
          <CardDescription>Last {series.length} daily snapshots</CardDescription>
        </CardHeader>
        <CardContent>
          <MetricsTrendChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active subscriptions</CardTitle>
            <CardDescription>Pre-computed via daily sync</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-foam)]">
              {latest?.activeSubscriptions ?? 0}
            </p>
            {subsDelta && (
              <p
                className={`mt-1 text-xs ${subsDelta.positive ? "text-[var(--color-flood)]" : "text-[var(--color-breach)]"}`}
              >
                {subsDelta.text}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>Download snapshot history as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/api/metrics/export" className="ms-btn ms-btn-gilt inline-flex no-underline">
              Download CSV
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-metrics" />
      </div>
    </div>
  );
}
