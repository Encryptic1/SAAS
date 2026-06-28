import { HookDashboardShell } from "@/components/hook-dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <HookDashboardShell>{children}</HookDashboardShell>;
}
