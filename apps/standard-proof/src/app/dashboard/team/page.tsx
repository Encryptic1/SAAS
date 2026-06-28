import { ProofDashboardShell } from "@/components/proof-dashboard-shell";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <ProofDashboardShell>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="standard-proof" />
    </ProofDashboardShell>
  );
}
