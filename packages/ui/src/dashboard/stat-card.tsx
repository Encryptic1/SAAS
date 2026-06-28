import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function StatCard({ label, value, hint, trend, className }: StatCardProps) {
  return (
    <div className={cn("ms-dash-stat-card", className)}>
      <p className="ms-dash-stat-label">{label}</p>
      <p className="ms-dash-stat-value">{value}</p>
      {(hint || trend) && (
        <div className="ms-dash-stat-meta">
          {trend && (
            <span
              className={cn(
                "ms-dash-stat-trend",
                trend.positive === true && "ms-dash-stat-trend-up",
                trend.positive === false && "ms-dash-stat-trend-down",
              )}
            >
              {trend.value}
            </span>
          )}
          {hint && <span className="ms-dash-stat-hint">{hint}</span>}
        </div>
      )}
    </div>
  );
}
