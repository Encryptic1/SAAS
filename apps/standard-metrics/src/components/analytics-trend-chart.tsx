"use client";

import { LineChart } from "@market-standard/ui";

interface AnalyticsTrendChartProps {
  data: Array<{ date: string; mrr: number; arr: number; activeSubscriptions: number }>;
  metric: "mrr" | "arr" | "activeSubscriptions";
}

const FORMATTERS: Record<AnalyticsTrendChartProps["metric"], (v: number) => string> = {
  mrr: (v) => `$${v.toLocaleString()}`,
  arr: (v) => `$${Math.round(v).toLocaleString()}`,
  activeSubscriptions: (v) => v.toLocaleString(),
};

const LABELS: Record<AnalyticsTrendChartProps["metric"], string> = {
  mrr: "MRR",
  arr: "ARR",
  activeSubscriptions: "Active subscriptions",
};

export function AnalyticsTrendChart({ data, metric }: AnalyticsTrendChartProps) {
  return (
    <LineChart
      data={data}
      xKey="date"
      series={[{ key: metric, label: LABELS[metric] }]}
      formatY={FORMATTERS[metric]}
    />
  );
}
