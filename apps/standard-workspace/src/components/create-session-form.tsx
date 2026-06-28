"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const APP_OPTIONS = [
  "standard-polls",
  "standard-proof",
  "standard-metrics",
  "standard-hook",
  "standard-release",
  "standard-vault",
  "standard-links",
  "standard-snippets",
  "standard-status",
  "standard-regex",
  "standard-postmortem",
  "standard-lens",
  "standard-cron",
];

export function CreateSessionForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(app: string) {
    setSelected((prev) => (prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, apps: selected.join(",") }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to start session");
        return;
      }
      router.refresh();
      setLabel("");
      setSelected([]);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <p className="font-semibold text-sm">Start a dev session</p>
      <div className="space-y-1">
        <label className="ms-label">Label</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          placeholder="Friday polish"
          className="ms-input"
        />
      </div>
      <div className="space-y-1">
        <label className="ms-label">Apps</label>
        <div className="flex flex-wrap gap-1.5">
          {APP_OPTIONS.map((app) => (
            <button
              key={app}
              type="button"
              onClick={() => toggle(app)}
              className={`text-xs px-2 py-1 rounded border ${
                selected.includes(app)
                  ? "border-[var(--accent-foam)] bg-[rgba(57,255,20,0.12)] text-[var(--accent-foam)]"
                  : "border-[var(--hairline)] opacity-70"
              }`}
            >
              {app.replace("standard-", "")}
            </button>
          ))}
        </div>
        <p className="ms-app-muted text-xs">Leave empty to start the whole suite.</p>
      </div>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="ms-btn-primary">
        {loading ? "Starting…" : "Start session"}
      </button>
    </form>
  );
}
