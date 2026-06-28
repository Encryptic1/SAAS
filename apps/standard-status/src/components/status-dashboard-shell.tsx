"use client";

import { DashboardShell } from "@market-standard/ui/dashboard";

export function StatusDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-status" productName="Standard Status">
      {children}
    </DashboardShell>
  );
}
