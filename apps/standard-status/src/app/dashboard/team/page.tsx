import { StatusDashboardShell } from "@/components/status-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <StatusDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-status" />
    </StatusDashboardShell>
  );
}
