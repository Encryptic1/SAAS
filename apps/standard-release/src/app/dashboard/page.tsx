import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@market-standard/ui";
import { getDashboardStats, listOwnerNotes, listOwnerRepos } from "@/lib/release-data";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const repos = await listOwnerRepos();
  const notes = await listOwnerNotes();

  return (
    <>
      <h1 className="ms-app-title">Overview</h1>
      <p className="mt-2 ms-app-muted">Your release notes workflow at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Repos" value={String(stats.repos)} />
        <StatCard label="Release notes" value={String(stats.notes)} />
        <StatCard label="Published" value={String(stats.published)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connected repos</CardTitle>
            <CardDescription>
              <Link href="/dashboard/repos" className="ms-app-link">
                Manage all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.length === 0 ? (
              <p className="text-sm ms-app-muted">No repos connected yet.</p>
            ) : (
              repos.slice(0, 5).map((repo) => (
                <div key={repo.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{repo.repoFullName}</p>
                  <p className="text-sm ms-app-muted">branch: {repo.defaultBranch}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
            <CardDescription>
              <Link href="/dashboard/notes" className="ms-app-link">
                View all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm ms-app-muted">Generate your first release notes from a repo.</p>
            ) : (
              notes.slice(0, 5).map((note) => (
                <div key={note.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">
                    {note.title ?? note.version} · {note.repoFullName}
                  </p>
                  <Link
                    href={`/dashboard/notes/${note.id}`}
                    className="ms-app-link text-sm no-underline hover:underline"
                  >
                    {note.publishedAt ? "Published" : "Draft"} →
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
