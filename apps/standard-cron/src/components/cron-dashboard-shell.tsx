"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui/dashboard";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Jobs", exact: true },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function CronDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-cron" productName="Standard Cron" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
