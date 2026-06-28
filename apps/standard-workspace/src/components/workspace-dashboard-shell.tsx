"use client";

import { DashboardShell } from "@market-standard/ui/dashboard";

export function WorkspaceDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell product="standard-workspace" productName="Standard Workspace">
      {children}
    </DashboardShell>
  );
}
