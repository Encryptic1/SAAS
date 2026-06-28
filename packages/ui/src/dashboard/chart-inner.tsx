"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
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
const DEEP = "var(--bg-deep)";

export interface DashboardChartSeries {
  key: string;
  label?: string;
  color?: string;
}

export interface LineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: DashboardChartSeries[];
  height?: number;
  className?: string;
  formatY?: (value: number) => string;
  formatX?: (value: string) => string;
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
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

export function LineChartInner({
  data,
  xKey,
  series,
  height = 280,
  className,
  formatY,
  formatX,
}: LineChartProps) {
  return (
    <div className={cn("ms-dash-chart", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={HAIRLINE} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: MIST, fontSize: 11 }}
            axisLine={{ stroke: HAIRLINE }}
            tickLine={false}
            tickFormatter={formatX}
          />
          <YAxis
            tick={{ fill: MIST, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={formatY ?? ((v) => v.toLocaleString())}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: FLOOD, strokeOpacity: 0.25 }}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label ?? s.key}
              stroke={s.color ?? FLOOD}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: s.color ?? FLOOD, stroke: DEEP, strokeWidth: 2 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export const chartAccentColor = "var(--color-flood-soft)";
