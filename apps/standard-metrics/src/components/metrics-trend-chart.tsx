"use client";

import { LineChart } from "@market-standard/ui";

interface MetricsTrendChartProps {
  data: Array<{ date: string; mrr: number; arr: number }>;
}

export function MetricsTrendChart({ data }: MetricsTrendChartProps) {
  return (
    <LineChart
      data={data}
      xKey="date"
      series={[{ key: "mrr", label: "MRR" }]}
      formatY={(v) => `$${v.toLocaleString()}`}
    />
  );
}
