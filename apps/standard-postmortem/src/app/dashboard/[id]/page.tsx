import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { PostmortemEditor } from "@/components/postmortem-editor";
import { getOwnerId } from "@/lib/owner";
import { getIncident, listIncidents, getRecurrenceSuggestions } from "@/lib/postmortem-data";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return <PostmortemDashboardShell><div>Sign in</div></PostmortemDashboardShell>;
  const [result, allIncidents, suggestions] = await Promise.all([
    getIncident(id),
    listIncidents(ownerId),
    getRecurrenceSuggestions(ownerId, 0.4),
  ]);
  if (!result) notFound();
  const { incident, actionItems, recurrenceLinks } = result;

  return (
    <PostmortemDashboardShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs ms-app-muted hover:underline">← Back to list</Link>
            <h1 className="text-2xl font-semibold mt-1">Postmortem</h1>
            <p className="text-xs ms-app-muted">
              from {incident.source ?? "manual"} · created {new Date(incident.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <PostmortemEditor
          incident={{
            ...incident,
            timeline: incident.timeline as Array<{ at: string; text: string }> | null,
            sections: incident.sections as { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string } | null,
          }}
          actionItems={actionItems}
          recurrenceLinks={recurrenceLinks}
          suggestions={suggestions}
          allIncidents={allIncidents.map((i) => ({ id: i.id, title: i.title }))}
        />
      </div>
    </PostmortemDashboardShell>
  );
}
