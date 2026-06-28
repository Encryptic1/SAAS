"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { cn } from "../lib/utils";

const FLOOD = "var(--color-flood)";
const MIST = "var(--text-mist)";
const HAIRLINE = "var(--hairline)";

export interface BarChartSeries {
  key: string;
  label?: string;
  color?: string;
}

export interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: BarChartSeries[];
  height?: number;
  className?: string;
  formatY?: (value: number) => string;
  formatX?: (value: string) => string;
  layout?: "horizontal" | "vertical";
}

function BarTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ms-dash-chart-tooltip">
      <p className="ms-dash-chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="ms-dash-chart-tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function BarChartInner({
  data,
  xKey,
  series,
  height = 280,
  className,
  formatY,
  formatX,
  layout = "horizontal",
}: BarChartProps) {
  return (
    <div className={cn("ms-dash-chart", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={HAIRLINE} strokeDasharray="4 4" vertical={layout === "vertical"} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: MIST, fontSize: 11 }}
            axisLine={{ stroke: HAIRLINE }}
            tickLine={false}
            tickFormatter={formatX}
            type={layout === "vertical" ? "number" : "category"}
          />
          <YAxis
            tick={{ fill: MIST, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={formatY ?? ((v) => v.toLocaleString())}
            type={layout === "vertical" ? "category" : "number"}
          />
          <Tooltip
            content={<BarTooltip />}
            cursor={{ fill: FLOOD, fillOpacity: 0.1 }}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label ?? s.key}
              fill={s.color ?? FLOOD}
              radius={layout === "horizontal" ? [4, 4, 0, 0] : [0, 4, 4, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
