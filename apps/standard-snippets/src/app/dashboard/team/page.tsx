import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <SnippetsDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-snippets" />
    </SnippetsDashboardShell>
  );
}
