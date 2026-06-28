import { loadMetricsOverview } from "../../../../lib/metrics-data";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const { series } = await loadMetricsOverview();

  const header = [
    "snapshot_date",
    "mrr",
    "arr",
    "churn_rate",
    "ltv",
    "active_subscriptions",
  ].join(",");

  const rows = series.map((s: (typeof series)[number]) =>
    [
      s.snapshotDate.toISOString(),
      s.mrr.toFixed(2),
      s.arr.toFixed(2),
      s.churnRate.toFixed(4),
      s.ltv.toFixed(2),
      s.activeSubscriptions,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="metric-snapshots.csv"',
    },
  });
}
