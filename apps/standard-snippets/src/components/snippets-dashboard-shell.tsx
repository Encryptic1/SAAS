"use client";

import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";
import type { ReactNode } from "react";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/new", label: "New snippet" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function SnippetsDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-snippets" productName="Standard Snippets" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
