import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <WorkspaceDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-workspace" />
    </WorkspaceDashboardShell>
  );
}
