import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { SnippetEditor } from "@/components/snippet-editor";
import { getOwnerId } from "@/lib/owner";
import { getSnippet, listSnippetVersions } from "@/lib/snippets-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function SnippetDetail({ id }: { id: string }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return notFound();
  const snippet = await getSnippet(id);
  if (!snippet || snippet.ownerId !== ownerId) return notFound();
  const versions = await listSnippetVersions(id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ms-dash-h1">{snippet.title}</h1>
        <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
          {snippet.language} · created {new Date(snippet.createdAt).toLocaleString()} · updated {new Date(snippet.updatedAt).toLocaleString()}
        </p>
      </header>
      <SnippetEditor
        snippetId={snippet.id}
        initialTitle={snippet.title}
        initialLanguage={snippet.language}
        initialBody={snippet.body}
        initialTags={snippet.tags}
        initialVersions={versions.map((v) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          versionNote: v.versionNote,
          body: v.body,
          createdAt: v.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

export default async function SnippetDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <SnippetsDashboardShell>
      <Suspense fallback={<div className="ms-mono text-sm">Loading…</div>}>
        <SnippetDetail id={id} />
      </Suspense>
    </SnippetsDashboardShell>
  );
}
