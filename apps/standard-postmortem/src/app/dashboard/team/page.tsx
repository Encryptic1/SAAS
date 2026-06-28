import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <PostmortemDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-postmortem" />
    </PostmortemDashboardShell>
  );
}
