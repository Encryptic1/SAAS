import { cn } from "../lib/utils";

export interface SparklineProps {
  values: Array<number>;
  /** Width in px. Defaults to 60. */
  width?: number;
  /** Height in px. Defaults to 16. */
  height?: number;
  /** Color override (CSS color). Defaults to `--color-flood`. */
  color?: string;
  /** Stroke width in px. Defaults to 1.5. */
  strokeWidth?: number;
  /** Render a filled area below the line. */
  filled?: boolean;
  /** Treat values as binary 0/1 (e.g. pass/fail runs); render as bars. */
  binary?: boolean;
  /** For binary mode: color for `1` values. */
  onColor?: string;
  /** For binary mode: color for `0` values. */
  offColor?: string;
  className?: string;
}

export function Sparkline({
  values,
  width = 60,
  height = 16,
  color,
  strokeWidth = 1.5,
  filled = true,
  binary = false,
  onColor,
  offColor,
  className,
}: SparklineProps) {
  if (values.length === 0) {
    return <span className={cn("ms-dash-sparkline-empty", className)} style={{ width, height }} aria-hidden />;
  }

  if (binary) {
    const barWidth = width / Math.max(values.length, 1);
    return (
      <svg
        className={cn("ms-dash-sparkline", className)}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Last ${values.length} runs`}
      >
        {values.map((v, i) => {
          const fill = v >= 1 ? (onColor ?? "var(--color-flood)") : (offColor ?? "var(--color-breach)");
          return (
            <rect
              key={i}
              x={i * barWidth + 0.5}
              y={1}
              width={Math.max(barWidth - 1, 1)}
              height={height - 2}
              rx={1}
              fill={fill}
              opacity={v >= 1 ? 0.85 : 0.55}
            />
          );
        })}
      </svg>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - strokeWidth) - strokeWidth / 2;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${width.toFixed(2)},${height} L0,${height} Z`
      : "";

  const stroke = color ?? "var(--color-flood)";

  return (
    <svg
      className={cn("ms-dash-sparkline", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend over ${values.length} points`}
    >
      {filled && areaPath && <path d={areaPath} fill={stroke} opacity={0.12} />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
