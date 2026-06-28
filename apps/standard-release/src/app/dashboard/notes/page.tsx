import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@market-standard/ui";
import { listOwnerNotes } from "@/lib/release-data";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await listOwnerNotes();

  return (
    <>
      <h1 className="ms-app-title">Release notes</h1>
      <p className="mt-2 ms-app-muted">Generated changelogs from merged pull requests.</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All notes</CardTitle>
          <CardDescription>
            <Link href="/dashboard/repos" className="ms-app-link">
              Generate from a repo →
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Connect a repo and generate release notes from merged PRs."
            />
          ) : (
            notes.map((note) => (
              <div key={note.id} className="ms-app-card-inner">
                <p className="font-medium text-[var(--text-foam)]">
                  {note.title ?? `v${note.version}`}
                </p>
                <p className="text-sm ms-app-muted">
                  {note.repoFullName} · {note.publishedAt ? "Published" : "Draft"}
                </p>
                <Link
                  href={`/dashboard/notes/${note.id}`}
                  className="ms-app-link mt-2 inline-block text-sm no-underline hover:underline"
                >
                  Edit →
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
