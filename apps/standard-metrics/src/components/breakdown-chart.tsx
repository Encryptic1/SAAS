"use client";

import { BarChart, BarChartSeries } from "@market-standard/ui";

interface BreakdownChartProps {
  data: Array<{ label: string; mrr: number; subs: number }>;
  metric: "mrr" | "subs";
}

export function BreakdownChart({ data, metric }: BreakdownChartProps) {
  const series: BarChartSeries[] = [
    { key: metric, label: metric === "mrr" ? "MRR" : "Subscriptions" },
  ];
  return (
    <BarChart
      data={data}
      xKey="label"
      series={series}
      formatY={metric === "mrr" ? (v) => `$${v.toLocaleString()}` : (v) => v.toLocaleString()}
    />
  );
}
