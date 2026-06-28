import type { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Optional custom illustration rendered above the title. */
  illustration?: ReactNode;
  /** Variant name to render a built-in illustration. */
  preset?: "default" | "inbox" | "chart" | "list" | "search" | "settings" | "celebrate";
  className?: string;
}

const PRESET_ILLUSTRATIONS: Record<NonNullable<EmptyStateProps["preset"]>, ReactNode> = {
  default: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 14h32" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="11" r="1.5" fill="currentColor" />
      <circle cx="15" cy="11" r="1.5" fill="currentColor" />
    </svg>
  ),
  inbox: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M4 28v8a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4v-8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 28l6-22h24l6 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 28h10l3 4h10l3-4h10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  chart: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <path d="M4 38h36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="8" y="22" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="19" y="14" width="6" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="30" y="8" width="6" height="26" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  list: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="8" width="28" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="18" width="28" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="28" width="20" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  search: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="17" cy="17" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M25 25l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <circle cx="21" cy="21" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21 4v6M21 32v6M4 21h6M32 21h6M9 9l4 4M29 29l4 4M33 9l-4 4M13 29l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  celebrate: (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <path d="M21 4l3.5 8.5L33 16l-8.5 3.5L21 28l-3.5-8.5L9 16l8.5-3.5L21 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 32l3-3M36 32l-3-3M9 38l1.5-2M33 38l-1.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ title, description, action, illustration, preset = "default", className }: EmptyStateProps) {
  const art = illustration ?? PRESET_ILLUSTRATIONS[preset];
  return (
    <div className={cn("ms-dash-empty", className)}>
      <div className="ms-dash-empty-icon" aria-hidden>
        {art}
      </div>
      <h3 className="ms-dash-empty-title">{title}</h3>
      {description && <p className="ms-dash-empty-desc">{description}</p>}
      {action && <div className="ms-dash-empty-action">{action}</div>}
    </div>
  );
}
