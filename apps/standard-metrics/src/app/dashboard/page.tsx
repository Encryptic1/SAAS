import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KpiCard,
  PageHeader,
  PoweredByBadge,
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

  const mrrSpark = series.slice(-14).map((s) => s.mrr);
  const arrSpark = series.slice(-14).map((s) => s.arr);
  const churnSpark = series.slice(-14).map((s) => s.churnRate * 100);
  const subsSpark = series.slice(-14).map((s) => s.activeSubscriptions);

  const mrrDelta = latest && previous ? formatDelta(latest.mrr, previous.mrr) : undefined;
  const arrDelta = latest && previous ? formatDelta(latest.arr, previous.arr) : undefined;
  const churnDelta =
    latest && previous ? formatDelta(latest.churnRate * 100, previous.churnRate * 100, true) : undefined;
  const ltvDelta = latest && previous ? formatDelta(latest.ltv, previous.ltv) : undefined;
  const subsDelta =
    latest && previous
      ? formatDelta(latest.activeSubscriptions, previous.activeSubscriptions)
      : undefined;

  const statusActions = (
    <>
      {connected && latest && (
        <Badge variant="success" dot>
          {process.env.NEXT_PUBLIC_LOCAL_DEV === "true" ? "Local dev" : "Connected"}
        </Badge>
      )}
      {!latest && process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && (
        <Badge variant="warning" dot>
          No data
        </Badge>
      )}
    </>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Standard Metrics"
        title="Overview"
        subtitle={
          latest
            ? `Latest snapshot: ${latest.snapshotDate.toLocaleString()}${accountId ? ` · ${accountId}` : ""}`
            : connected
              ? "Connect Stripe to start pulling MRR, ARR, and churn snapshots."
              : "Stripe MRR/ARR dashboard — connect your account to begin."
        }
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
        actions={statusActions}
      />

      {connected && latest && process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && (
        <p className="text-sm text-[var(--color-flood)]">
          Showing seeded PGlite metrics (local dev).
        </p>
      )}
      {!latest && process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && (
        <p className="text-sm text-[var(--color-caution)]">
          No metrics yet — run <code className="ms-app-pre inline px-1 py-0.5">pnpm db:setup</code> and ensure the
          gateway is running.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="MRR"
          value={latest ? `$${latest.mrr.toLocaleString()}` : "—"}
          delta={mrrDelta?.text}
          comparison="vs prior snapshot"
          invertDelta={false}
          spark={mrrSpark}
          hint="Monthly recurring revenue"
        />
        <KpiCard
          label="ARR"
          value={latest ? `$${latest.arr.toLocaleString()}` : "—"}
          delta={arrDelta?.text}
          comparison="vs prior snapshot"
          spark={arrSpark}
          hint="Annualized recurring revenue"
        />
        <KpiCard
          label="Churn"
          value={latest ? `${(latest.churnRate * 100).toFixed(1)}%` : "—"}
          delta={churnDelta?.text}
          comparison="vs prior snapshot"
          invertDelta
          spark={churnSpark}
          hint="Lower is better"
        />
        <KpiCard
          label="LTV"
          value={latest ? `$${Math.round(latest.ltv).toLocaleString()}` : "—"}
          delta={ltvDelta?.text}
          comparison="vs prior snapshot"
          spark={subsSpark}
          hint="Lifetime value per customer"
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

        <Card className="border-l-2 border-[var(--color-gilt)]/60">
          <CardHeader>
            <CardTitle>Track payment-link clicks</CardTitle>
            <CardDescription>Cross-sell from Standard Links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm ms-app-muted">
              See which Stripe payment links drive revenue. Standard Links shortens, brands, and
              instruments every payment link — then reports clicks back here.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_LINKS_URL ?? "http://localhost:3007"}/dashboard?source=metrics`}
              className="ms-btn ms-btn-secondary no-underline text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Open Standard Links →
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-metrics" />
      </div>
    </div>
  );
}
