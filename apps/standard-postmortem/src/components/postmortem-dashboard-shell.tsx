"use client";

import { DashboardShell } from "@market-standard/ui/dashboard";

export function PostmortemDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-postmortem" productName="Standard Postmortem">
      {children}
    </DashboardShell>
  );
}
