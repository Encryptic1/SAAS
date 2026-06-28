import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Sparkline } from "./sparkline";

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Delta vs previous period — e.g. "+12.4%" or "-3.1%". */
  delta?: string;
  /** When true, treats negative delta as positive (e.g. churn down is good). */
  invertDelta?: boolean;
  /** Comparison period label — e.g. "vs prior 30d". */
  comparison?: string;
  /** Sparkline values for inline trend. */
  spark?: Array<number>;
  /** Binary sparkline (pass/fail runs). */
  sparkBinary?: boolean;
  hint?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  invertDelta = false,
  comparison,
  spark,
  sparkBinary = false,
  hint,
  className,
}: KpiCardProps) {
  const deltaPositive = delta
    ? invertDelta
      ? delta.startsWith("-")
      : !delta.startsWith("-") && delta !== "0" && delta !== "0%"
    : null;

  return (
    <div className={cn("ms-dash-kpi-card", className)}>
      <div className="ms-dash-kpi-head">
        <p className="ms-dash-kpi-label">{label}</p>
        {spark && spark.length > 0 && (
          <Sparkline values={spark} width={64} height={18} binary={sparkBinary} />
        )}
      </div>
      <p className="ms-dash-kpi-value">{value}</p>
      <div className="ms-dash-kpi-meta">
        {delta && (
          <span
            className={cn(
              "ms-dash-kpi-delta",
              deltaPositive === true && "ms-dash-kpi-delta-up",
              deltaPositive === false && "ms-dash-kpi-delta-down",
            )}
          >
            {deltaPositive === true ? "▲" : deltaPositive === false ? "▼" : "■"} {delta.replace(/^[+-]/, "")}
          </span>
        )}
        {comparison && <span className="ms-dash-kpi-comparison">{comparison}</span>}
      </div>
      {hint && <p className="ms-dash-kpi-hint">{hint}</p>}
    </div>
  );
}
