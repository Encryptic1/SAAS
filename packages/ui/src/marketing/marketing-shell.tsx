import type { ReactNode } from "react";

interface MarketingShellProps {
  children: ReactNode;
}

/** Wraps marketing pages — sets FloodG8-compatible theme on document root. */
export function MarketingShell({ children }: MarketingShellProps) {
  return <div className="ms-marketing" data-theme="market-standard">{children}</div>;
}
