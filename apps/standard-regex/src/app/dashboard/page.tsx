import { RegexDashboardShell } from "@/components/regex-dashboard-shell";
import { PatternsList } from "@/components/patterns-list";
import { getOwnerId } from "@/lib/owner";
import { listPatterns } from "@/lib/regex-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <RegexDashboardShell><div>Sign in</div></RegexDashboardShell>;
  const patterns = await listPatterns(ownerId);

  const allTags = Array.from(new Set(patterns.flatMap((p) => p.tags ?? []))).slice(0, 12);

  return (
    <RegexDashboardShell>
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Regex library</h1>
            <p className="text-sm ms-app-muted">{patterns.length} pattern(s) saved.</p>
          </div>
          <a href="/dashboard/new" className="ms-btn">New pattern</a>
        </header>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((t) => (
              <a key={t} href={`?tag=${encodeURIComponent(t)}`} className="ms-badge ms-badge-neutral text-xs hover:ms-row-hover">
                #{t}
              </a>
            ))}
          </div>
        )}

        <PatternsList patterns={patterns.map((p) => ({ ...p }))} />
      </div>
    </RegexDashboardShell>
  );
}
