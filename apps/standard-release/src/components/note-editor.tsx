"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface NoteEditorProps {
  noteId: string;
  initialBody: string;
  initialTitle: string | null;
  published: boolean;
}

export function NoteEditor({ noteId, initialBody, initialTitle, published }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [bodyMd, setBodyMd] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save(patch: { bodyMd?: string; title?: string; publish?: boolean }) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setMessage(patch.publish ? "Published" : "Saved");
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="ms-app-label">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="ms-app-input"
          placeholder="Release title"
        />
      </div>
      <div>
        <label htmlFor="body" className="ms-app-label">
          Release notes (Markdown)
        </label>
        <textarea
          id="body"
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          className="ms-app-input min-h-[320px] font-mono text-sm"
          rows={16}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => save({ bodyMd, title: title || undefined })}
          className="ms-btn ms-btn-primary"
        >
          {loading ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => save({ bodyMd, title: title || undefined, publish: true })}
          className="ms-btn"
        >
          {published ? "Update published" : "Publish"}
        </button>
      </div>
      {published && (
        <p className="text-sm ms-app-muted">This note is published.</p>
      )}
      {message && <p className="text-sm ms-app-success">{message}</p>}
      {error && <p className="text-sm ms-app-error">{error}</p>}
    </div>
  );
}
