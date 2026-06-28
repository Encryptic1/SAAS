"use client";

import { DashboardShell } from "@market-standard/ui";
import type { ReactNode } from "react";

export function ProofDashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      product="standard-proof"
      productName="Standard Proof"
      contentHref="/dashboard/collections"
    >
      {children}
    </DashboardShell>
  );
}
