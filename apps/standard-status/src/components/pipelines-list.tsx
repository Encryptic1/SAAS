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

const FAILED_STATES = new Set(["failed", "error"]);

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

  const postmortemUrl = process.env.NEXT_PUBLIC_POSTMORTEM_URL ?? "http://localhost:3011";
  const hookUrl = process.env.NEXT_PUBLIC_HOOK_URL ?? "http://localhost:3004";
  const releaseUrl = process.env.NEXT_PUBLIC_RELEASE_URL ?? "http://localhost:3005";

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
          const failed = p.lastStatus ? FAILED_STATES.has(p.lastStatus) : false;
          const postmortemLink = `${postmortemUrl}/dashboard/new?source=status&pipeline_id=${p.id}&pipeline_name=${encodeURIComponent(p.name)}`;
          const hookLink = `${hookUrl}/dashboard/inboxes?source=status&pipeline_id=${p.id}&pipeline_name=${encodeURIComponent(p.name)}`;
          const releaseLink = p.repoFullName
            ? `${releaseUrl}/dashboard?repo=${encodeURIComponent(p.repoFullName)}&source=status`
            : `${releaseUrl}/dashboard?source=status&pipeline_name=${encodeURIComponent(p.name)}`;
          return (
            <div key={p.id} className="block p-4 hover:ms-row-hover transition-colors">
              <a href={`/dashboard/pipelines/${p.id}`} className="block">
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
              {failed && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-3">
                  <span className="text-xs ms-app-muted self-center">Failed pipeline —</span>
                  <a
                    href={postmortemLink}
                    className="ms-btn ms-btn-secondary no-underline text-xs"
                    title="Start a blameless postmortem for this failure"
                  >
                    Create postmortem →
                  </a>
                  <a
                    href={releaseLink}
                    className="ms-btn ms-btn-ghost no-underline text-xs"
                    title="View the release notes for this repo"
                  >
                    Release notes →
                  </a>
                  <a
                    href={hookLink}
                    className="ms-btn ms-btn-ghost no-underline text-xs"
                    title="Inspect the webhook payload in Standard Hook"
                  >
                    Debug in Hook →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
