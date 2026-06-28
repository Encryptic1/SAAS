import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PoweredByBadge, StatCard } from "@market-standard/ui";
import { listOwnerLinks, type LinkRecord } from "@/lib/links-data";

export const dynamic = "force-dynamic";

interface LinkWithClicks {
  link: LinkRecord;
  ctr: number;
}

function buildChartData(rows: LinkRecord[]) {
  return rows
    .slice()
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 10)
    .map((r) => ({
      label: r.name.length > 16 ? `${r.name.slice(0, 14)}…` : r.name,
      clicks: r.clickCount,
    }));
}

export default async function AnalyticsPage() {
  const links = await listOwnerLinks();
  const totalClicks = links.reduce((acc, l) => acc + l.clickCount, 0);
  const activeLinks = links.filter((l) => l.active).length;
  const pausedLinks = links.length - activeLinks;
  const avgClicks = links.length ? Math.round(totalClicks / links.length) : 0;

  const chartData = buildChartData(links);
  const maxClicks = chartData[0]?.clicks ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-app-title">Analytics</h1>
        <p className="mt-2 ms-app-muted">Click performance across your payment links.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Avg per link" value={avgClicks.toLocaleString()} />
        <StatCard label="Active links" value={String(activeLinks)} />
        <StatCard label="Paused" value={String(pausedLinks)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 links by clicks</CardTitle>
          <CardDescription>Bar lengths are relative to the top performer.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm ms-app-muted">No clicks recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {chartData.map((d) => {
                const pct = maxClicks > 0 ? Math.round((d.clicks / maxClicks) * 100) : 0;
                return (
                  <div key={d.label} className="space-y-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[var(--text-foam)]">{d.label}</span>
                      <span className="ms-app-muted">{d.clicks.toLocaleString()} clicks</span>
                    </div>
                    <div style={{ height: 8, background: "var(--bg-deep)", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{ width: `${pct}%`, height: "100%", background: "var(--color-flood)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-link performance</CardTitle>
          <CardDescription>
            <Link href="/dashboard/links" className="ms-app-link">
              Manage all links →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm ms-app-muted">No links yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--hairline)] pb-2 last:border-0"
                >
                  <span className="text-[var(--text-foam)]">{l.name}</span>
                  <span className="ms-app-muted">
                    {l.clickCount.toLocaleString()} clicks ·{" "}
                    {l.lastClickedAt
                      ? `last ${new Date(l.lastClickedAt).toLocaleDateString()}`
                      : "never clicked"}{" "}
                    · {l.active ? "Active" : "Paused"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-links" />
      </div>
    </div>
  );
}
