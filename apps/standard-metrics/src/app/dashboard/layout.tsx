import type { ReactNode } from "react";
import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/links", label: "Payment Links" },
  { href: "/dashboard/quota", label: "Quota Monitor" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/billing", label: "Billing" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-metrics" productName="Standard Metrics" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
