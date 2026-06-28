"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  summary: string | null;
};

const SEV_LABEL: Record<string, string> = {
  sev1: "SEV1",
  sev2: "SEV2",
  sev3: "SEV3",
  sev4: "SEV4",
};

const SEV_COLOR: Record<string, string> = {
  sev1: "ms-status-failed",
  sev2: "ms-status-failed",
  sev3: "ms-status-running",
  sev4: "ms-status-neutral",
};

const STATUS_LABEL: Record<string, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export function IncidentsList({ incidents }: { incidents: Incident[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("sev3");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, severity, summary: summary || undefined }),
      });
      setOpen(false);
      setTitle("");
      setSummary("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/incidents/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Incidents ({incidents.length})</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} className="ms-btn-ghost text-xs">
          {open ? "Cancel" : "Declare incident"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleCreate} className="ms-card p-4 space-y-3">
          <div className="space-y-1">
            <label className="ms-label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Stripe webhook delivery delay"
              className="ms-input"
            />
          </div>
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
            <label className="ms-label">Summary (optional)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="ms-input"
            />
          </div>
          <button type="submit" disabled={loading} className="ms-btn">
            {loading ? "Creating…" : "Create incident"}
          </button>
        </form>
      )}

      {incidents.length === 0 ? (
        <div className="ms-card p-6 text-center">
          <p className="text-sm ms-app-muted">No incidents. Nice. 🎉</p>
        </div>
      ) : (
        <div className="ms-card divide-y">
          {incidents.map((i) => (
            <div key={i.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{i.title}</p>
                  {i.summary && <p className="text-xs ms-app-muted mt-1">{i.summary}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`ms-badge ${SEV_COLOR[i.severity] ?? "ms-status-neutral"} ms-badge-strong`}>
                    {SEV_LABEL[i.severity] ?? i.severity}
                  </span>
                  <span className="text-xs ms-app-muted">
                    {STATUS_LABEL[i.status] ?? i.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs ms-app-muted">
                <span>
                  Started {new Date(i.startedAt).toLocaleString()}
                  {i.resolvedAt && ` · resolved ${new Date(i.resolvedAt).toLocaleString()}`}
                </span>
                <div className="flex gap-2">
                  {i.status !== "resolved" && (
                    <button type="button" onClick={() => handleResolve(i.id)} className="ms-btn-ghost text-xs">
                      Resolve
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(i.id)} className="ms-btn-ghost text-xs ms-app-danger">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
