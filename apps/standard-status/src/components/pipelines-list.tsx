"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Pipeline = {
  id: string;
  source: string;
  name: string;
  repoFullName: string | null;
  lastStatus: string | null;
  lastRunAt: string | null;
  last30Runs: Array<{ status: string; at: string }> | null;
};

const STATUS_COLORS: Record<string, string> = {
  success: "ms-status-success",
  failed: "ms-status-failed",
  running: "ms-status-running",
  cancelled: "ms-status-neutral",
  ready: "ms-status-success",
  building: "ms-status-running",
  error: "ms-status-failed",
  canceled: "ms-status-neutral",
};

export function PipelinesList({ pipelines }: { pipelines: Pipeline[] }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  if (pipelines.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No pipelines yet. Add one above or wire up the intake webhook.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pipelines ({pipelines.length})</h2>
        <button type="button" onClick={handleSync} disabled={syncing} className="ms-btn-ghost text-xs">
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </div>
      <div className="ms-card divide-y">
        {pipelines.map((p) => {
          const runs = p.last30Runs ?? [];
          return (
            <a
              key={p.id}
              href={`/dashboard/pipelines/${p.id}`}
              className="block p-4 hover:ms-row-hover transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs ms-app-muted truncate">
                    <span className="inline-block px-1.5 py-0.5 rounded ms-badge ms-badge-neutral mr-2 uppercase">{p.source}</span>
                    {p.repoFullName ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.lastStatus && (
                    <span className={`ms-status-dot ${STATUS_COLORS[p.lastStatus] ?? "ms-status-neutral"}`} title={p.lastStatus} />
                  )}
                  <span className="text-xs ms-app-muted">
                    {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : "never"}
                  </span>
                </div>
              </div>
              {runs.length > 0 && (
                <div className="mt-2 flex gap-0.5">
                  {runs.slice(0, 30).map((r, i) => (
                    <span
                      key={i}
                      className={`ms-run-bar ${STATUS_COLORS[r.status] ?? "ms-status-neutral"}`}
                      title={`${r.status} · ${new Date(r.at).toLocaleString()}`}
                    />
                  ))}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
