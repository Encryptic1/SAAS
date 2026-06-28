import { ReleaseDashboardShell } from "@/components/release-dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ReleaseDashboardShell>{children}</ReleaseDashboardShell>;
}
