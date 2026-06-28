import type { ReactNode } from "react";
import { DashboardShell, type DashboardNavItem } from "@market-standard/ui";

const NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/polls", label: "Polls" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/standup", label: "Standup" },
  { href: "/dashboard/digest", label: "Digest" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell product="standard-polls" productName="Standard Polls" nav={NAV}>
      {children}
    </DashboardShell>
  );
}
