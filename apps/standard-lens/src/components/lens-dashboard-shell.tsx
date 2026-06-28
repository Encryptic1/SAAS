"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui/dashboard";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Query library", exact: true },
  { href: "/dashboard/slow", label: "Slow queries" },
  { href: "/dashboard/explain", label: "Explain" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function LensDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-lens" productName="Standard Lens" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
