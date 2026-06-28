"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";
import type { ReactNode } from "react";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function VaultDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-vault" productName="Standard Vault" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
