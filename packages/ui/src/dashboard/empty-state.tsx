import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("ms-dash-empty", className)}>
      <div className="ms-dash-empty-icon" aria-hidden>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 14h32" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="11" r="1.5" fill="currentColor" />
          <circle cx="15" cy="11" r="1.5" fill="currentColor" />
        </svg>
      </div>
      <h3 className="ms-dash-empty-title">{title}</h3>
      {description && <p className="ms-dash-empty-desc">{description}</p>}
      {action && <div className="ms-dash-empty-action">{action}</div>}
    </div>
  );
}
