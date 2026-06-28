"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Snippet {
  id: string;
  title: string;
  language: string;
  body: string;
  tags: string[];
}

/** Form to create a new snippet. On success, navigates to the editor. */
export function CreateSnippetForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
