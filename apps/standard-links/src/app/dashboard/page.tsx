import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard, PoweredByBadge } from "@market-standard/ui";
import { getDashboardStats, listOwnerLinks } from "@/lib/links-data";
import { MetricsCrossSellWidget } from "@/components/metrics-cross-sell-widget";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const links = await listOwnerLinks();
  const metricsUrl = process.env.NEXT_PUBLIC_METRICS_URL ?? "http://localhost:3003";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-app-title">Overview</h1>
        <p className="mt-2 ms-app-muted">Your payment links at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total links" value={String(stats.totalLinks)} />
        <StatCard label="Active" value={String(stats.activeLinks)} />
        <StatCard label="Total clicks" value={stats.totalClicks.toLocaleString()} />
        <StatCard label="Clicks (7d)" value={stats.clicksLast7d.toLocaleString()} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top link</CardTitle>
            <CardDescription>
              <Link href="/dashboard/links" className="ms-app-link">
                Manage all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topLink ? (
              <div className="space-y-1">
                <p className="font-medium text-[var(--text-foam)]">{stats.topLink.name}</p>
                <p className="text-sm ms-app-muted">
                  {stats.topLink.clickCount.toLocaleString()} clicks ·{" "}
                  {stats.topLink.lastClickedAt
                    ? `last ${new Date(stats.topLink.lastClickedAt).toLocaleDateString()}`
                    : "no clicks yet"}
                </p>
                <p className="text-xs ms-app-muted">
                  Share: <code className="ms-app-pre">{process.env.NEXT_PUBLIC_APP_URL ?? ""}/go/{stats.topLink.slug}</code>
                </p>
              </div>
            ) : (
              <p className="text-sm ms-app-muted">No links yet — add one to see top performer.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last 5 links created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm ms-app-muted">No links yet.</p>
            ) : (
              links.slice(0, 5).map((l) => (
                <div key={l.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{l.name}</p>
                  <p className="text-sm ms-app-muted">
                    {l.clickCount.toLocaleString()} clicks · {l.active ? "Active" : "Paused"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <MetricsCrossSellWidget
        totalClicks={stats.totalClicks}
        topLinkName={stats.topLink?.name ?? null}
        metricsUrl={metricsUrl}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-links" />
      </div>
    </div>
  );
}
