"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConnectRepoForm() {
  const router = useRouter();
  const [repoFullName, setRepoFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName, defaultBranch }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not connect repo");
        return;
      }
      setRepoFullName("");
      setDefaultBranch("main");
      router.refresh();
    } catch {
      setError("Could not connect repo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="repo" className="ms-app-label">
          Repository (owner/name)
        </label>
        <input
          id="repo"
          value={repoFullName}
          onChange={(e) => setRepoFullName(e.target.value)}
          className="ms-app-input"
          placeholder="acme/widget"
          required
        />
      </div>
      <div>
        <label htmlFor="branch" className="ms-app-label">
          Default branch
        </label>
        <input
          id="branch"
          value={defaultBranch}
          onChange={(e) => setDefaultBranch(e.target.value)}
          className="ms-app-input"
          placeholder="main"
        />
      </div>
      <button type="submit" disabled={loading} className="ms-btn ms-btn-primary">
        {loading ? "Connecting…" : "Connect repo"}
      </button>
      {error && <p className="text-sm ms-app-error">{error}</p>}
    </form>
  );
}
