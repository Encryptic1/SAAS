import { cn } from "../lib/utils";

export interface UsageMeterProps {
  label: string;
  used: number;
  /** Pass `-1` for unlimited. */
  limit: number;
  className?: string;
}

export function UsageMeter({ label, used, limit, className }: UsageMeterProps) {
  const unlimited = limit < 0;
  const ratio = unlimited ? 0 : limit === 0 ? 1 : Math.min(used / limit, 1);
  const pct = unlimited ? 0 : Math.round(ratio * 100);
  const nearLimit = !unlimited && ratio >= 0.85;

  return (
    <div className={cn("ms-dash-meter", className)}>
      <div className="ms-dash-meter-head">
        <span className="ms-dash-meter-label">{label}</span>
        <span className="ms-dash-meter-count">
          {used.toLocaleString()}
          {unlimited ? " / ∞" : ` / ${limit.toLocaleString()}`}
        </span>
      </div>
      <div className="ms-dash-meter-track" role="meter" aria-valuenow={used} aria-valuemin={0} aria-valuemax={unlimited ? used : limit}>
        <div
          className={cn("ms-dash-meter-bar", nearLimit && "ms-dash-meter-bar-warn")}
          style={{ width: unlimited ? "12%" : `${pct}%` }}
        />
      </div>
      {!unlimited && nearLimit && (
        <p className="ms-dash-meter-hint">Approaching plan limit</p>
      )}
    </div>
  );
}
