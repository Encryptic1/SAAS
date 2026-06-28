"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Snippet {
  id: string;
  title: string;
  language: string;
  body: string;
  tags: string[];
}

/** Form to create a new snippet. On success, navigates to the editor.
 *  Reads `?code=`, `?language=`, `?title=`, `?source=` query params for cross-sell pre-fill
 *  (e.g. from Standard Regex "Save as Snippet"). */
export function CreateSnippetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const lang = searchParams.get("language");
    const ttl = searchParams.get("title");
    const src = searchParams.get("source");
    if (code) setBody(code);
    if (lang) setLanguage(lang);
    if (ttl) setTitle(ttl);
    if (src === "regex") {
      setPrefillNote("Pre-filled from Standard Regex");
      if (!tagsInput) setTagsInput("regex");
    }
  }, [searchParams, tagsInput]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          language: language.trim() || "plaintext",
          body,
          tags,
        }),
      });
      const data = (await res.json()) as { snippet?: Snippet; error?: string };
      if (!res.ok || !data.snippet) {
        setError(data.error ?? "Failed to create snippet");
        return;
      }
      router.push(`/dashboard/${data.snippet.id}`);
      router.refresh();
    } catch {
      setError("Could not create snippet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <h3 className="font-semibold">New snippet</h3>
      {prefillNote && (
        <div className="ms-app-card-inner border-l-2 border-[var(--color-flood)] px-3 py-2 text-xs">
          <span className="text-[var(--color-flood)] font-medium">{prefillNote}</span>
          <span className="ms-app-muted"> — fields pre-filled, edit and save.</span>
        </div>
      )}
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Debounce (TypeScript)"
          className="ms-input"
          required
        />
      </Field>
      <Field label="Language">
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
      </Field>
      <Field label="Body">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="// paste or type your snippet here"
          rows={10}
          className="ms-input font-mono text-xs"
        />
      </Field>
      <Field label="Tags (comma-separated)">
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="typescript, utility, react"
          className="ms-input"
        />
      </Field>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading || !title.trim()} className="ms-btn">
        {loading ? "Creating…" : "Create snippet"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="ms-mono-eyebrow">{label}</span>
      {children}
    </label>
  );
}
