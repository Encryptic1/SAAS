import { notFound } from "next/navigation";
import { getSharedSnippet } from "@/lib/snippets-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SharedSnippetPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getSharedSnippet(slug);
  if (!result) return notFound();

  const { snippet, share } = result;

  return (
    <div className="ms-app ms-noise min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <div className="ms-mono-eyebrow text-[var(--color-gilt-light)]">Shared via Standard Snippets</div>
          <h1 className="text-3xl font-bold mt-1">{snippet.title}</h1>
          <div className="ms-mono text-xs text-[var(--text-fog)] mt-2">
            {snippet.language} · shared {new Date(share.createdAt).toLocaleString()}
            {share.expiresAt && ` · expires ${new Date(share.expiresAt).toLocaleString()}`}
          </div>
          {snippet.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {snippet.tags.map((t) => (
                <span key={t} className="ms-chip text-xs">#{t}</span>
              ))}
            </div>
          )}
        </header>
        <pre className="ms-card p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap">{snippet.body}</pre>
        <footer className="mt-6 text-center">
          <a href="/" className="ms-mono text-xs text-[var(--text-fog)] hover:text-[var(--color-gilt-light)]">
            Make your own snippets at Standard Snippets
          </a>
        </footer>
      </div>
    </div>
  );
}
