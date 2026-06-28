import { PostmortemDashboardShell } from "@/components/postmortem-dashboard-shell";
import { getOwnerId } from "@/lib/owner";
import { listIncidents, getRecurrenceSuggestions } from "@/lib/postmortem-data";

export const dynamic = "force-dynamic";

export default async function RecurrencePage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <PostmortemDashboardShell><div>Sign in</div></PostmortemDashboardShell>;
  const [incidents, suggestions] = await Promise.all([
    listIncidents(ownerId),
    getRecurrenceSuggestions(ownerId, 0.3),
  ]);

  const byId = new Map(incidents.map((i) => [i.id, i]));
  // Build adjacency: for each incident, which others is it linked to (via suggestions)
  const adj = new Map<string, Array<{ id: string; title: string; similarity: number }>>();
  for (const s of suggestions) {
    const a = adj.get(s.fromId) ?? [];
    a.push({ id: s.toId, title: s.toTitle, similarity: s.similarity });
    adj.set(s.fromId, a);
    const b = adj.get(s.toId) ?? [];
    b.push({ id: s.fromId, title: s.fromTitle, similarity: s.similarity });
    adj.set(s.toId, b);
  }

  return (
    <PostmortemDashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Recurrence graph</h1>
          <p className="text-sm ms-app-muted">
            Incidents with similar root causes. {suggestions.length} edge(s) at threshold 0.30.
          </p>
        </header>

        {suggestions.length === 0 ? (
          <div className="ms-card p-6 text-center text-sm ms-app-muted">
            No similar pairs detected. Write more detailed root-cause notes to surface recurrence.
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((i) => {
              const edges = adj.get(i.id) ?? [];
              if (edges.length === 0) return null;
              return (
                <div key={i.id} className="ms-card p-4 space-y-2">
                  <a href={`/dashboard/${i.id}`} className="font-medium hover:underline">{i.title}</a>
                  <div className="space-y-1">
                    {edges.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-sm ms-row p-2 rounded border border-white/5">
                        <span className="ms-app-muted">↻ looks like</span>
                        <a href={`/dashboard/${e.id}`} className="hover:underline flex-1 mx-2 truncate">{e.title}</a>
                        <span className="text-xs ms-app-muted">{Math.round(e.similarity * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="ms-card p-4 space-y-1 text-xs ms-app-muted">
          <p className="font-semibold text-sm">How similarity is computed</p>
          <p>Local dev uses Jaccard token-overlap on root-cause text (tokens &gt; 4 chars). Production wires pgvector cosine similarity on <code className="ms-code">text-embedding-3-small</code> embeddings — see the Supabase migration.</p>
        </div>
      </div>
    </PostmortemDashboardShell>
  );
}
