"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";
import type { ReactNode } from "react";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/repos", label: "Repos" },
  { href: "/dashboard/notes", label: "Notes" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function ReleaseDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-release" productName="Standard Release" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
