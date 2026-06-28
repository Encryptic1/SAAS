"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateQueryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sqlText, setSqlText] = useState("");
  const [databaseLabel, setDatabaseLabel] = useState("default");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !sqlText.trim()) {
      setError("Name and SQL are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sqlText: sqlText.trim(),
          databaseLabel: databaseLabel.trim() || "default",
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = (await res.json()) as { query?: { id: string }; error?: string };
      if (!res.ok || !data.query) {
        setError(data.error ?? "Failed to save query");
        return;
      }
      setName("");
      setSqlText("");
      setTags("");
      router.refresh();
    } catch {
      setError("Could not save query");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <div className="space-y-1">
        <label htmlFor="lens-name" className="text-xs ms-app-muted">Name</label>
        <input
          id="lens-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Active subscriptions by plan"
          className="ms-input w-full"
          disabled={loading}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="lens-sql" className="text-xs ms-app-muted">SQL</label>
        <textarea
          id="lens-sql"
          value={sqlText}
          onChange={(e) => setSqlText(e.target.value)}
          placeholder="SELECT * FROM subscriptions WHERE plan = 'starter'"
          rows={4}
          className="ms-input w-full font-mono text-xs"
          disabled={loading}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="lens-db" className="text-xs ms-app-muted">Database label</label>
          <input
            id="lens-db"
            value={databaseLabel}
            onChange={(e) => setDatabaseLabel(e.target.value)}
            className="ms-input w-full"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="lens-tags" className="text-xs ms-app-muted">Tags (comma-separated)</label>
          <input
            id="lens-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="hot, billing"
            className="ms-input w-full"
            disabled={loading}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="ms-btn ms-btn-primary" disabled={loading}>
          {loading ? "Saving…" : "Save query"}
        </button>
        {error && <span className="text-xs ms-app-error">{error}</span>}
      </div>
    </form>
  );
}
