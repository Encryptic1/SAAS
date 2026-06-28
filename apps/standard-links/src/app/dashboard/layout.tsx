import { LinksDashboardShell } from "@/components/links-dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LinksDashboardShell>{children}</LinksDashboardShell>;
}
