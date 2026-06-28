import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { IncidentsList } from "@/components/incidents-list";
import { getOwnerId } from "@/lib/owner";
import { listIncidents, getRecurrenceSuggestions } from "@/lib/postmortem-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <PostmortemDashboardShell><div>Sign in</div></PostmortemDashboardShell>;
  const [incidents, suggestions] = await Promise.all([
    listIncidents(ownerId),
    getRecurrenceSuggestions(ownerId, 0.4),
  ]);

  // Build a count of recurrence links per incident from suggestions
  const recurrenceCount = new Map<string, number>();
  for (const s of suggestions) {
    recurrenceCount.set(s.fromId, (recurrenceCount.get(s.fromId) ?? 0) + 1);
    recurrenceCount.set(s.toId, (recurrenceCount.get(s.toId) ?? 0) + 1);
  }

  const open = incidents.filter((i) => i.status !== "resolved" && i.status !== "archived").length;

  return (
    <PostmortemDashboardShell>
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Postmortems</h1>
            <p className="text-sm ms-app-muted">
              {incidents.length} total · {open} open · {suggestions.length} recurrence suggestion(s)
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/recurrence" className="ms-btn-ghost text-sm">Recurrence graph</a>
            <a href="/dashboard/new" className="ms-btn">New postmortem</a>
          </div>
        </header>

        <IncidentsList
          incidents={incidents.map((i) => ({
            ...i,
            timeline: i.timeline as Array<{ at: string; text: string }> | null,
            sections: i.sections as { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string } | null,
            recurrenceCount: recurrenceCount.get(i.id) ?? 0,
          }))}
        />
      </div>
    </PostmortemDashboardShell>
  );
}
