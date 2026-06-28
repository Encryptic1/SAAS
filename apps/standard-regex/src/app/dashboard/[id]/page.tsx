import { RegexDashboardShell } from "@/components/regex-dashboard-shell";
import { RegexEditor } from "@/components/regex-editor";
import { getOwnerId } from "@/lib/owner";
import { getPattern } from "@/lib/regex-data";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PatternDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ownerId = await getOwnerId();
  if (!ownerId) return <RegexDashboardShell><div>Sign in</div></RegexDashboardShell>;
  const result = await getPattern(id);
  if (!result) notFound();
  const { pattern, forks } = result;

  return (
    <RegexDashboardShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href="/dashboard" className="text-xs ms-app-muted hover:underline">← Back to library</Link>
            <h1 className="text-2xl font-semibold mt-1">{pattern.name}</h1>
            {pattern.description && <p className="text-sm ms-app-muted mt-1">{pattern.description}</p>}
          </div>
          <div className="text-right text-xs ms-app-muted space-y-1">
            <p>flags: <code className="ms-code">{pattern.flags}</code></p>
            <p>{forks.length} fork(s)</p>
            {pattern.isPublic && <p className="ms-status-success">public</p>}
          </div>
        </div>
        <RegexEditor
          patternId={pattern.id}
          initialPattern={pattern.pattern}
          initialFlags={pattern.flags}
          initialName={pattern.name}
          initialDescription={pattern.description ?? ""}
          initialTestCases={(pattern.testCases as Array<{ input: string; expectedMatches: number | null; note?: string }>) ?? []}
          initialTags={pattern.tags ?? []}
          initialIsPublic={pattern.isPublic}
        />
        {forks.length > 0 && (
          <div className="ms-card p-4 space-y-2">
            <p className="text-xs font-semibold">Forks</p>
            {forks.map((f) => (
              <div key={f.id} className="text-xs font-mono">
                /{f.pattern}/{f.flags} <span className="ms-app-muted">— {new Date(f.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </RegexDashboardShell>
  );
}
