import { Suspense } from "react";
import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { getOwnerId } from "@/lib/owner";
import { listOwnerSnippets } from "@/lib/snippets-data";

export const dynamic = "force-dynamic";

async function OverviewContent() {
  const ownerId = await getOwnerId();
  const snippets = ownerId ? await listOwnerSnippets(ownerId) : [];
  const allTags = new Set<string>();
  for (const s of snippets) for (const t of s.tags) allTags.add(t);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ms-dash-h1">Snippets</h1>
        <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
          Save, tag, version, and share code snippets. VSIX save-from-selection + FloodG8 Plan Editor insert.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Snippets" value={snippets.length} />
        <Stat label="Tags" value={allTags.size} />
        <Stat label="Languages" value={new Set(snippets.map((s) => s.language)).size} />
        <Stat label="Shared" value={0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your snippets</h3>
            <a href="/dashboard/new" className="ms-btn-sm">+ New</a>
          </div>
          {snippets.length === 0 ? (
            <div className="ms-card p-6 text-center">
              <p className="ms-mono text-sm text-[var(--text-fog)]">
                No snippets yet. Create one to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {snippets.map((s) => (
                <li key={s.id} className="ms-card p-4 hover:border-[var(--color-gilt)]">
                  <a href={`/dashboard/${s.id}`} className="block">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">{s.title}</span>
                      <span className="ms-chip">{s.language}</span>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ms-card p-3">
      <div className="ms-mono-eyebrow">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
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
