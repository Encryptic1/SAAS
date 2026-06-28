"use client";

import { useState } from "react";

interface VersionRow {
  id: string;
  versionNumber: number;
  versionNote: string | null;
  body: string;
  createdAt: string;
}

interface SnippetEditorProps {
  snippetId: string;
  initialTitle: string;
  initialLanguage: string;
  initialBody: string;
  initialTags: string[];
  initialVersions: VersionRow[];
}

export function SnippetEditor({
  snippetId,
  initialTitle,
  initialLanguage,
  initialBody,
  initialTags,
  initialVersions,
}: SnippetEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [language, setLanguage] = useState(initialLanguage);
  const [body, setBody] = useState(initialBody);
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [versions, setVersions] = useState<VersionRow[]>(initialVersions);
  const [versionNote, setVersionNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const res = await fetch(`/api/snippets/${snippetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          language,
          body,
          tags,
          versionNote: versionNote.trim() || null,
        }),
      });
      const data = (await res.json()) as { snippet?: { updatedAt: string }; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSuccess("Saved");
      setVersionNote("");
      // Refresh versions
      const vRes = await fetch(`/api/snippets/${snippetId}`);
      const vData = (await vRes.json()) as { versions?: VersionRow[] };
      if (vData.versions) setVersions(vData.versions);
    } catch {
      setError("Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setError(null);
    setShareUrl(null);
    try {
      const res = await fetch(`/api/snippets/${snippetId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { share?: { slug: string }; error?: string };
      if (!res.ok || !data.share) {
        setError(data.error ?? "Failed to mint share link");
        return;
      }
      setShareUrl(`${window.location.origin}/s/${data.share.slug}`);
    } catch {
      setError("Could not create share link");
    }
  }

  async function handleCopyBody() {
    try {
      await navigator.clipboard.writeText(body);
      setSuccess("Copied body to clipboard");
    } catch {
      setError("Clipboard unavailable");
    }
  }

  function restoreVersion(v: VersionRow) {
    if (!window.confirm(`Restore v${v.versionNumber}? This replaces the current body.`)) return;
    setBody(v.body);
    setVersionNote(`restored v${v.versionNumber}`);
  }

  return (
    <div className="space-y-6">
      <section className="ms-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block space-y-1 md:col-span-2">
            <span className="ms-mono-eyebrow">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="ms-input" />
          </label>
          <label className="block space-y-1">
            <span className="ms-mono-eyebrow">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ms-input">
              <option value="typescript">typescript</option>
              <option value="javascript">javascript</option>
              <option value="python">python</option>
              <option value="go">go</option>
              <option value="rust">rust</option>
              <option value="sql">sql</option>
              <option value="bash">bash</option>
              <option value="css">css</option>
              <option value="html">html</option>
              <option value="json">json</option>
              <option value="yaml">yaml</option>
              <option value="plaintext">plaintext</option>
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className="ms-mono-eyebrow">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="ms-input font-mono text-xs"
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="ms-mono-eyebrow">Tags (comma-separated)</span>
            <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="ms-input" />
          </label>
          <label className="block space-y-1">
            <span className="ms-mono-eyebrow">Version note (optional)</span>
            <input
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="what changed?"
              className="ms-input"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} disabled={saving} className="ms-btn">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={handleCopyBody} className="ms-btn-sm">
            Copy body
          </button>
          <button type="button" onClick={handleShare} className="ms-btn-sm">
            Mint share link
          </button>
        </div>
        {shareUrl && (
          <div className="ms-card p-3 border-[var(--color-gilt)] bg-[var(--color-gilt)]/5">
            <p className="ms-mono-eyebrow text-[var(--color-gilt-light)]">Share URL (public, no auth):</p>
            <pre className="ms-mono text-xs mt-1 break-all whitespace-pre-wrap">{shareUrl}</pre>
          </div>
        )}
        {error && <p className="ms-app-error text-xs">{error}</p>}
        {success && <p className="text-xs text-[var(--color-flood)]">{success}</p>}
      </section>

      <section className="ms-card p-4">
        <h3 className="font-semibold mb-3">Version history ({versions.length})</h3>
        {versions.length === 0 ? (
          <p className="ms-mono text-xs text-[var(--text-fog)]">No versions yet.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="border-t border-[var(--hairline)] py-2">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <span className="font-mono font-semibold">v{v.versionNumber}</span>
                    {v.versionNote && <span className="ml-2 text-sm text-[var(--text-mist)]">{v.versionNote}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="ms-mono text-xs text-[var(--text-fog)]">
                      {new Date(v.createdAt).toLocaleString()}
                    </span>
                    <button type="button" onClick={() => restoreVersion(v)} className="ms-btn-sm">
                      Restore
                    </button>
                  </div>
                </div>
                <pre className="ms-mono text-xs mt-2 ms-card p-2 overflow-x-auto max-h-40">{v.body}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
