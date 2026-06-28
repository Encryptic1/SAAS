"use client";

import dynamic from "next/dynamic";
import type { BarChartProps } from "./bar-chart-inner";

// recharts' ResponsiveContainer touches `window` at module-load time, which
// crashes SSR. Load the real bar chart client-only.
const BarChartInner = dynamic(
  () => import("./bar-chart-inner").then((m) => m.BarChartInner),
  {
    ssr: false,
    loading: () => <div className="ms-dash-chart ms-app-muted text-sm">Loading chart…</div>,
  },
);

export type { BarChartProps, BarChartSeries } from "./bar-chart-inner";

export function BarChart(props: BarChartProps) {
  return <BarChartInner {...props} />;
}
