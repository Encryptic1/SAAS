import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { CreateIncidentForm } from "@/components/create-incident-form";

export const dynamic = "force-dynamic";

export default function NewPostmortemPage() {
  return (
    <PostmortemDashboardShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">New postmortem</h1>
          <p className="text-sm ms-app-muted">Start a blameless postmortem. You can fill in the timeline and root cause next.</p>
        </div>
        <CreateIncidentForm />
      </div>
    </PostmortemDashboardShell>
  );
}
