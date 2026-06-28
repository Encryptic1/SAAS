import { Suspense } from "react";
import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { Badge, EmptyState, KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listOwnerSnippets } from "@/lib/snippets-data";

export const dynamic = "force-dynamic";

async function OverviewContent() {
  const ownerId = await getOwnerId();
  const snippets = ownerId ? await listOwnerSnippets(ownerId) : [];
  const allTags = new Set<string>();
  for (const s of snippets) for (const t of s.tags) allTags.add(t);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Standard Snippets"
        title="Snippets"
        subtitle="Save, tag, version, and share code snippets. VSIX save-from-selection + FloodG8 Plan Editor insert."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Snippets" }]}
        actions={
          <a href="/dashboard/new" className="ms-btn ms-btn-primary no-underline">
            + New snippet
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Snippets" value={String(snippets.length)} hint="Saved snippets" />
        <KpiCard label="Tags" value={String(allTags.size)} hint="Distinct tags" />
        <KpiCard label="Languages" value={String(new Set(snippets.map((s) => s.language)).size)} hint="Languages used" />
        <KpiCard label="Shared" value={String(0)} hint="Public share URLs" />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your snippets</h3>
            <a href="/dashboard/new" className="ms-btn-sm">+ New</a>
          </div>
          {snippets.length === 0 ? (
            <EmptyState
              preset="list"
              title="No snippets yet"
              description="Create your first snippet — paste code, set language + tags, and it's auto-versioned."
              action={
                <a href="/dashboard/new" className="ms-btn ms-btn-primary no-underline">
                  Create snippet
                </a>
              }
            />
          ) : (
            <ul className="space-y-2">
              {snippets.map((s) => (
                <li key={s.id} className="ms-card p-4 hover:border-[var(--color-gilt)]">
                  <a href={`/dashboard/${s.id}`} className="block">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{s.title}</span>
                      <Badge variant="neutral">{s.language}</Badge>
                    </div>
                    {s.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.map((t) => (
                          <span key={t} className="ms-chip text-xs">#{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="ms-mono text-xs text-[var(--text-fog)] mt-2">
                      updated {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-3">
          <div className="ms-card p-4">
            <h3 className="font-semibold mb-2">Quick actions</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard/new" className="hover:text-[var(--color-gilt-light)]">+ New snippet</a></li>
              <li><a href="/api/export/json" className="hover:text-[var(--color-gilt-light)]" target="_blank" rel="noreferrer">Export all as JSON</a></li>
            </ul>
          </div>
          <div className="ms-card p-4">
            <h3 className="font-semibold mb-2">Tags</h3>
            {allTags.size === 0 ? (
              <p className="ms-mono text-xs text-[var(--text-fog)]">No tags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {Array.from(allTags).sort().map((t) => (
                  <a key={t} href={`/dashboard?tag=${encodeURIComponent(t)}`} className="ms-chip text-xs hover:border-[var(--color-gilt)]">
                    #{t}
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default function SnippetsOverviewPage() {
  return (
    <SnippetsDashboardShell>
      <Suspense fallback={<div className="ms-mono text-sm">Loading…</div>}>
        <OverviewContent />
      </Suspense>
    </SnippetsDashboardShell>
  );
}
