"use client";

import { DashboardShell } from "@market-standard/ui/dashboard";

export function RegexDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-regex" productName="Standard Regex">
      {children}
    </DashboardShell>
  );
}
