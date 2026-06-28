import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { IncidentsList } from "@/components/incidents-list";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
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

  const recurrenceCount = new Map<string, number>();
  for (const s of suggestions) {
    recurrenceCount.set(s.fromId, (recurrenceCount.get(s.fromId) ?? 0) + 1);
    recurrenceCount.set(s.toId, (recurrenceCount.get(s.toId) ?? 0) + 1);
  }

  const open = incidents.filter((i) => i.status !== "resolved" && i.status !== "archived").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const severities = new Set(incidents.map((i) => i.severity)).size;

  return (
    <PostmortemDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Postmortem"
          title="Postmortems"
          subtitle="Blameless retros with action items and recurrence detection."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Postmortems" }]}
          actions={
            <div className="flex gap-2">
              <a href="/dashboard/recurrence" className="ms-btn ms-btn-secondary no-underline">
                Recurrence graph
              </a>
              <a href="/dashboard/new" className="ms-btn ms-btn-primary no-underline">
                New postmortem
              </a>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <KpiCard label="Total" value={String(incidents.length)} hint="All-time incidents" />
          <KpiCard
            label="Open"
            value={String(open)}
            hint={open > 0 ? "Needs resolution" : "All resolved"}
            spark={[open > 0 ? 0 : 1]}
            sparkBinary
          />
          <KpiCard label="Resolved" value={String(resolved)} hint="Closed postmortems" />
          <KpiCard
            label="Recurrence links"
            value={String(suggestions.length)}
            hint={`${severities} severity level${severities === 1 ? "" : "s"}`}
          />
        </div>

        {open > 0 && (
          <div className="ms-card p-4 flex items-center gap-3 border-l-2 border-[var(--color-caution)]">
            <Badge variant="warning" dot>{open} open</Badge>
            <p className="text-sm text-[var(--text-mist)]">
              Triage open incidents first — link each to a Standard Status incident or Standard Hook event when available.
            </p>
          </div>
        )}

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
