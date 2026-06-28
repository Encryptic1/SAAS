import { ReleaseDashboardShell } from "@/components/release-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <ReleaseDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-release" />
    </ReleaseDashboardShell>
  );
}
