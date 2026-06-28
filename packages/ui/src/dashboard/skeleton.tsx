import type { CSSProperties } from "react";
import { cn } from "../lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Fixed height in px; when omitted, the element fills its container. */
  height?: number | string;
  /** Width in px or %. Defaults to 100%. */
  width?: number | string;
  /** Shape variant. `rect` (default), `circle`, `text`. */
  variant?: "rect" | "circle" | "text";
  /** For `text` variant: number of lines to render. */
  lines?: number;
}

export function Skeleton({ className, height, width = "100%", variant = "rect", lines = 1 }: SkeletonProps) {
  const style: CSSProperties = { width: typeof width === "number" ? `${width}px` : width };
  if (typeof height === "number") style.height = `${height}px`;
  else if (typeof height === "string") style.height = height;

  if (variant === "text") {
    return (
      <div className={cn("ms-dash-skeleton-stack", className)} style={style}>
        {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
          <div
            key={i}
            className="ms-dash-skeleton ms-dash-skeleton-text"
            style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div
        className={cn("ms-dash-skeleton", "ms-dash-skeleton-circle", className)}
        style={{ ...style, height: style.height ?? "2.5rem", width: style.width ?? "2.5rem", borderRadius: "999px" }}
        aria-hidden
      />
    );
  }

  return <div className={cn("ms-dash-skeleton", className)} style={style} aria-hidden />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("ms-dash-skeleton-card", className)} aria-hidden>
      <Skeleton width="40%" height={12} />
      <Skeleton height={28} className="mt-2" />
      <div className="ms-dash-skeleton-row">
        <Skeleton width="60%" height={12} />
        <Skeleton width="30%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn("ms-dash-skeleton-row", className)} aria-hidden>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === 0 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("ms-dash-skeleton-list", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
