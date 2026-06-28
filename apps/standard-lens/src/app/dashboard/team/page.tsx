import { LensDashboardShell } from "@/components/lens-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <LensDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-lens" />
    </LensDashboardShell>
  );
}
