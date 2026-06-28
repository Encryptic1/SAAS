"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Job } from "@/lib/cron-data";
import { describeCron } from "@/lib/cron-parser";

function statusBadge(status: string | null): string {
  if (!status) return "ms-badge-neutral";
  if (status === "ok") return "ms-badge-success";
  if (status === "failed" || status === "missed") return "ms-badge-error";
  if (status === "running") return "ms-badge-info";
  return "ms-badge-neutral";
}

function heartbeatUrl(token: string): string {
  if (typeof window === "undefined") return `/api/heartbeat/${token}`;
  return `${window.location.origin}/api/heartbeat/${token}`;
}

export function JobsList({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleDelete(job: Job) {
    if (!confirm(`Delete "${job.name}"? Run history will be removed too.`)) return;
    setBusy(job.id);
    try {
      await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function copyHeartbeat(job: Job) {
    try {
      await navigator.clipboard.writeText(`curl -X POST ${heartbeatUrl(job.heartbeatToken)}`);
      setCopied(job.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No monitored jobs yet. Create one above to get a heartbeat URL.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div key={job.id} className="ms-card p-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`/dashboard/${job.id}`} className="text-sm font-medium hover:underline truncate">
                {job.name}
              </a>
              <span className="ms-badge ms-badge-neutral text-[10px]">{job.source}</span>
              {job.lastStatus && (
                <span className={`ms-badge ${statusBadge(job.lastStatus)} text-[10px]`}>{job.lastStatus}</span>
              )}
            </div>
            <p className="mt-1 text-xs font-mono ms-app-muted">
              {job.scheduleCron} <span className="ms-app-muted">— {describeCron(job.scheduleCron)}</span>
            </p>
            <p className="mt-1 text-[11px] ms-app-muted">
              Window {job.expectedWindowMinutes}m + {job.graceMinutes}m grace
              {job.lastRunAt && <> · last run {new Date(job.lastRunAt).toLocaleString()}</>}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <button
              type="button"
              onClick={() => copyHeartbeat(job)}
              className="ms-btn ms-btn-ghost px-2 py-1 text-xs"
              title="Copy heartbeat curl"
            >
              {copied === job.id ? "Copied!" : "Copy curl"}
            </button>
            <a
              href={`/dashboard/${job.id}`}
              className="ms-btn ms-btn-ghost px-2 py-1 text-xs no-underline"
            >
              Details
            </a>
            <button
              type="button"
              onClick={() => handleDelete(job)}
              disabled={busy === job.id}
              className="ms-btn ms-btn-ghost px-2 py-1 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
