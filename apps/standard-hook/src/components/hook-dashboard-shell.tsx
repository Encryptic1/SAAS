"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";
import type { ReactNode } from "react";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/inboxes", label: "Inboxes" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function HookDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-hook" productName="Standard Hook" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
