import { Suspense } from "react";
import { PageHeader } from "@market-standard/ui";
import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { CreateIncidentForm } from "@/components/create-incident-form";

export const dynamic = "force-dynamic";

export default function NewPostmortemPage() {
  return (
    <PostmortemDashboardShell>
      <div className="space-y-8 max-w-2xl">
        <PageHeader
          eyebrow="Standard Postmortem"
          title="New postmortem"
          subtitle="Start a blameless postmortem. Fill in the timeline and root cause next."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "New" }]}
        />
        <Suspense fallback={<div className="ms-card p-5 text-sm ms-app-muted">Loading form…</div>}>
          <CreateIncidentForm />
        </Suspense>
      </div>
    </PostmortemDashboardShell>
  );
}
