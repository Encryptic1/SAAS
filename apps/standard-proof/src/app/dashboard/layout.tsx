import { ProofDashboardShell } from "@/components/proof-dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProofDashboardShell>{children}</ProofDashboardShell>;
}
