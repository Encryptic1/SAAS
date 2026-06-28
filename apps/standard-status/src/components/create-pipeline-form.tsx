"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreatePipelineForm() {
  const router = useRouter();
  const [source, setSource] = useState<"github" | "vercel" | "floodg8">("github");
  const [name, setName] = useState("");
  const [repoFullName, setRepoFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, name, repoFullName: repoFullName || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to create pipeline");
        return;
      }
      router.refresh();
      setName("");
      setRepoFullName("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <div className="space-y-1">
        <label className="ms-label">Source</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="ms-input"
        >
          <option value="github">GitHub Actions</option>
          <option value="vercel">Vercel</option>
          <option value="floodg8">FloodG8 Runner</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="ms-label">Pipeline name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="CI / Tests"
          className="ms-input"
        />
      </div>
      <div className="space-y-1">
        <label className="ms-label">Repo (optional)</label>
        <input
          value={repoFullName}
          onChange={(e) => setRepoFullName(e.target.value)}
          placeholder="marketstandard/saas"
          className="ms-input"
        />
      </div>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="ms-btn">
        {loading ? "Creating…" : "Add pipeline"}
      </button>
    </form>
  );
}
