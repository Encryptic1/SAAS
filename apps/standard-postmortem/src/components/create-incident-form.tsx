"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateIncidentForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("sev3");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, severity, summary: summary || undefined, source, status: "investigating" }),
      });
      const data = (await res.json()) as { incident?: { id: string }; error?: string };
      if (!res.ok || !data.incident) {
        setError(data.error ?? "Failed to create");
        return;
      }
      router.push(`/dashboard/${data.incident.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-5 space-y-4">
      <div className="space-y-1">
        <label className="ms-label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Stripe webhook delivery delay (June 27)"
          className="ms-input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="ms-label">Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="ms-input">
            <option value="sev1">SEV1 — Critical outage</option>
            <option value="sev2">SEV2 — Major degradation</option>
            <option value="sev3">SEV3 — Minor degradation</option>
            <option value="sev4">SEV4 — Nuisance / cosmetic</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="ms-label">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="ms-input">
            <option value="manual">Manual</option>
            <option value="hook">Standard Hook</option>
            <option value="status">Standard Status</option>
            <option value="pulse">Suite Pulse</option>
            <option value="slack">Slack</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="ms-label">Summary (optional)</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="ms-input"
        />
      </div>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="ms-btn">
        {loading ? "Creating…" : "Create postmortem"}
      </button>
    </form>
  );
}
