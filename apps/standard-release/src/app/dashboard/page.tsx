import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, KpiCard, PageHeader } from "@market-standard/ui";
import { getDashboardStats, listOwnerNotes, listOwnerRepos } from "@/lib/release-data";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const repos = await listOwnerRepos();
  const notes = await listOwnerNotes();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Standard Release"
        title="Overview"
        subtitle="Your release notes workflow at a glance."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Repos" value={String(stats.repos)} hint="Connected GitHub repos" />
        <KpiCard label="Release notes" value={String(stats.notes)} hint="Drafts + published" />
        <KpiCard label="Published" value={String(stats.published)} hint="Live on changelog" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              <EmptyState
                preset="list"
                title="No repos connected"
                description="Connect a GitHub repo to start generating release notes from merged PRs."
              />
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
              <EmptyState
                preset="list"
                title="No notes yet"
                description="Generate your first release notes from a connected repo."
              />
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
    </div>
  );
}
