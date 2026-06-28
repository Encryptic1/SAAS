import { RegexDashboardShell } from "@/components/regex-dashboard-shell";
import { PatternsList } from "@/components/patterns-list";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listPatterns } from "@/lib/regex-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <RegexDashboardShell><div>Sign in</div></RegexDashboardShell>;
  const patterns = await listPatterns(ownerId);

  const allTags = Array.from(new Set(patterns.flatMap((p) => p.tags ?? []))).slice(0, 12);
  const publicCount = patterns.filter((p) => p.isPublic).length;
  const tagCount = new Set(patterns.flatMap((p) => p.tags ?? [])).size;

  return (
    <RegexDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Regex"
          title="Regex library"
          subtitle={`${patterns.length} pattern(s) saved.`}
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Library" }]}
          actions={
            <a href="/dashboard/new" className="ms-btn ms-btn-primary no-underline">
              New pattern
            </a>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Patterns" value={String(patterns.length)} hint="Saved patterns" />
          <KpiCard label="Public" value={String(publicCount)} hint="Shareable + forkable" />
          <KpiCard label="Tags" value={String(tagCount)} hint="Distinct tags" />
        </div>

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
