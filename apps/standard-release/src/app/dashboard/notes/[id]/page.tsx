import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import { NoteEditor } from "@/components/note-editor";
import { getOwnerNote } from "@/lib/release-data";

export const dynamic = "force-dynamic";

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;
  const data = await getOwnerNote(id);
  if (!data) notFound();

  const { note, repo } = data;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ms-app-title">{note.title ?? `Release ${note.version}`}</h1>
          <p className="mt-2 ms-app-muted">
            {repo.repoFullName} · v{note.version}
          </p>
        </div>
        <Link href="/dashboard/notes" className="ms-app-link text-sm no-underline hover:underline">
          ← All notes
        </Link>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Edit release notes</CardTitle>
          <CardDescription>
            {note.publishedAt
              ? `Published ${new Date(note.publishedAt).toLocaleString()}`
              : "Draft — edit and publish when ready"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NoteEditor
            noteId={note.id}
            initialBody={note.bodyMd}
            initialTitle={note.title}
            published={!!note.publishedAt}
          />
        </CardContent>
      </Card>
    </>
  );
}
