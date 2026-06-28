import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "flood"
  | "gilt";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Render as a dot + label instead of a filled pill. */
  dot?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: "ms-dash-badge-neutral",
  info: "ms-dash-badge-info",
  success: "ms-dash-badge-success",
  warning: "ms-dash-badge-warning",
  danger: "ms-dash-badge-danger",
  flood: "ms-dash-badge-flood",
  gilt: "ms-dash-badge-gilt",
};

const DOT_CLASS: Record<BadgeVariant, string> = {
  neutral: "ms-dash-badge-dot-neutral",
  info: "ms-dash-badge-dot-info",
  success: "ms-dash-badge-dot-success",
  warning: "ms-dash-badge-dot-warning",
  danger: "ms-dash-badge-dot-danger",
  flood: "ms-dash-badge-dot-flood",
  gilt: "ms-dash-badge-dot-gilt",
};

export function Badge({ children, variant = "neutral", dot = false, className }: BadgeProps) {
  if (dot) {
    return (
      <span className={cn("ms-dash-badge-dot", className)}>
        <span className={cn("ms-dash-badge-dot-mark", DOT_CLASS[variant])} aria-hidden />
        <span className="ms-dash-badge-dot-label">{children}</span>
      </span>
    );
  }
  return <span className={cn("ms-dash-badge", VARIANT_CLASS[variant], className)}>{children}</span>;
}

export const SeverityBadge = ({ severity }: { severity: string }) => {
  const normalized = severity.toUpperCase();
  const variant: BadgeVariant =
    normalized === "SEV1" ? "danger" : normalized === "SEV2" ? "warning" : normalized === "SEV3" ? "info" : "neutral";
  return <Badge variant={variant}>{normalized}</Badge>;
};

export const StatusBadge = ({ status }: { status: string }) => {
  const lower = status.toLowerCase();
  const variant: BadgeVariant =
    lower === "resolved" || lower === "success" || lower === "passed" || lower === "ok"
      ? "success"
      : lower === "failed" || lower === "error" || lower === "active"
        ? "danger"
        : lower === "investigating" || lower === "monitoring" || lower === "pending" || lower === "running"
          ? "warning"
          : "info";
  return <Badge variant={variant}>{status}</Badge>;
};

export const PlanBadge = ({ plan }: { plan: string }) => {
  const variant: BadgeVariant = plan === "growth" || plan === "business" ? "gilt" : plan === "starter" ? "flood" : "neutral";
  return <Badge variant={variant}>{plan}</Badge>;
};
