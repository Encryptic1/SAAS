"use client";

import dynamic from "next/dynamic";
import type { LineChartProps } from "./chart-inner";

// recharts' ResponsiveContainer touches `window` at module-load time, which
// crashes SSR (`__webpack_modules__[moduleId] is not a function`). Load the
// real chart client-only and render a lightweight placeholder during SSR.
const LineChartInner = dynamic(
  () => import("./chart-inner").then((m) => m.LineChartInner),
  {
    ssr: false,
    loading: () => <div className="ms-dash-chart ms-app-muted text-sm">Loading chart…</div>,
  },
);

export type { LineChartProps, DashboardChartSeries } from "./chart-inner";

export function LineChart(props: LineChartProps) {
  return <LineChartInner {...props} />;
}

export const chartAccentColor = "var(--color-flood-soft)";
