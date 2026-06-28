"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Deployment = {
  id: string;
  environment: string;
  sha: string | null;
  status: string;
  deployedAt: string;
  url: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  ready: "ms-status-success",
  building: "ms-status-running",
  error: "ms-status-failed",
  canceled: "ms-status-neutral",
};

export function DeploymentsList({ pipelineId, deployments }: { pipelineId: string; deployments: Deployment[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [env, setEnv] = useState("production");
  const [sha, setSha] = useState("");
  const [status, setStatus] = useState("ready");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`/api/pipelines/${pipelineId}/deployments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment: env,
          sha: sha || undefined,
          status,
          url: url || undefined,
          pipelineStatus: status,
        }),
      });
      setOpen(false);
      setSha("");
      setUrl("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent deployments ({deployments.length})</h2>
        <button type="button" onClick={() => setOpen((v) => !v)} className="ms-btn-ghost text-xs">
          {open ? "Cancel" : "Log deploy"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleAdd} className="ms-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="ms-label">Environment</label>
              <select value={env} onChange={(e) => setEnv(e.target.value)} className="ms-input">
                <option value="production">production</option>
                <option value="preview">preview</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="ms-label">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="ms-input">
                <option value="ready">ready</option>
                <option value="building">building</option>
                <option value="error">error</option>
                <option value="canceled">canceled</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="ms-label">SHA (optional)</label>
            <input value={sha} onChange={(e) => setSha(e.target.value)} placeholder="abc1234" className="ms-input" />
          </div>
          <div className="space-y-1">
            <label className="ms-label">URL (optional)</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="ms-input" />
          </div>
          <button type="submit" disabled={loading} className="ms-btn">
            {loading ? "Saving…" : "Log deployment"}
          </button>
        </form>
      )}

      {deployments.length === 0 ? (
        <div className="ms-card p-6 text-center text-sm ms-app-muted">No deployments logged.</div>
      ) : (
        <div className="ms-card divide-y">
          {deployments.map((d) => (
            <div key={d.id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`ms-status-dot ${STATUS_COLORS[d.status] ?? "ms-status-neutral"}`} />
                <div className="min-w-0">
                  <p className="text-sm truncate">
                    <span className="ms-badge ms-badge-neutral uppercase">{d.environment}</span>
                    {d.sha && <span className="ml-2 font-mono text-xs">{d.sha.slice(0, 7)}</span>}
                  </p>
                  <p className="text-xs ms-app-muted">{new Date(d.deployedAt).toLocaleString()}</p>
                </div>
              </div>
              {d.url && (
                <a href={d.url} target="_blank" rel="noreferrer" className="ms-btn-ghost text-xs">
                  Open →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
