import { LensDashboardShell } from "@/components/lens-dashboard-shell";
import { SlowQueriesList } from "@/components/slow-queries-list";
import { KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listSlowQueries } from "@/lib/lens-data";

export const dynamic = "force-dynamic";

export default async function SlowQueriesPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <LensDashboardShell><div>Sign in</div></LensDashboardShell>;
  const slow = await listSlowQueries(ownerId, 100);

  const overThreshold = slow.filter((q) => q.durationMs > q.thresholdMs).length;
  const avgDuration =
    slow.length > 0
      ? Math.round((slow.reduce((sum, q) => sum + q.durationMs, 0) / slow.length) * 10) / 10
      : 0;
  const worst = slow.reduce((max, q) => (q.durationMs > max ? q.durationMs : max), 0);

  return (
    <LensDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Lens"
          title="Slow queries"
          subtitle={`${slow.length} capture(s) over your threshold.`}
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Slow queries" }]}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Captured" value={String(slow.length)} hint="Last 100" />
          <KpiCard label="Over threshold" value={String(overThreshold)} hint="Needs attention" />
          <KpiCard label="Worst" value={`${worst.toFixed(1)}ms`} hint={`Avg ${avgDuration}ms`} />
        </div>

        <SlowQueriesList slowQueries={slow} />
      </div>
    </LensDashboardShell>
  );
}
