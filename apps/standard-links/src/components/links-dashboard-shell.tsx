"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";
import type { ReactNode } from "react";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/links", label: "Payment Links" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function LinksDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-links" productName="Standard Links" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
