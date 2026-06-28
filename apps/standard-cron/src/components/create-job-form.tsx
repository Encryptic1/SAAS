"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { describeCron, validateCron } from "@/lib/cron-parser";

export function CreateJobForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scheduleCron, setScheduleCron] = useState("0 9 * * 1-5");
  const [source, setSource] = useState("vercel");
  const [expectedWindowMinutes, setExpectedWindowMinutes] = useState(5);
  const [graceMinutes, setGraceMinutes] = useState(2);
  const [alertChannel, setAlertChannel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cronErr = scheduleCron ? validateCron(scheduleCron) : null;
  const cronDesc = scheduleCron && !cronErr ? describeCron(scheduleCron) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !scheduleCron.trim()) {
      setError("Name and schedule are required");
      return;
    }
    if (cronErr) {
      setError(cronErr);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scheduleCron: scheduleCron.trim(),
          source,
          expectedWindowMinutes,
          graceMinutes,
          alertChannel: alertChannel.trim() || null,
        }),
      });
      const data = (await res.json()) as { job?: { id: string }; error?: string };
      if (!res.ok || !data.job) {
        setError(data.error ?? "Failed to create job");
        return;
      }
      setName("");
      setAlertChannel("");
      router.refresh();
    } catch {
      setError("Could not create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <div className="space-y-1">
        <label htmlFor="cron-name" className="text-xs ms-app-muted">Job name</label>
        <input
          id="cron-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nightly metrics sync"
          className="ms-input w-full"
          disabled={loading}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="cron-schedule" className="text-xs ms-app-muted">Schedule (5-field cron)</label>
          <input
            id="cron-schedule"
            value={scheduleCron}
            onChange={(e) => setScheduleCron(e.target.value)}
            placeholder="0 9 * * 1-5"
            className="ms-input w-full font-mono text-xs"
            disabled={loading}
          />
          {cronErr && <p className="text-xs ms-app-error">{cronErr}</p>}
          {cronDesc && <p className="text-xs ms-app-muted">{cronDesc}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor="cron-source" className="text-xs ms-app-muted">Source</label>
          <select
            id="cron-source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="ms-input w-full"
            disabled={loading}
          >
            <option value="vercel">Vercel Cron</option>
            <option value="github">GitHub Actions</option>
            <option value="floodg8">FloodG8 runner</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="cron-window" className="text-xs ms-app-muted">Expected window (minutes)</label>
          <input
            id="cron-window"
            type="number"
            min={1}
            value={expectedWindowMinutes}
            onChange={(e) => setExpectedWindowMinutes(Number(e.target.value))}
            className="ms-input w-full"
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="cron-grace" className="text-xs ms-app-muted">Grace minutes</label>
          <input
            id="cron-grace"
            type="number"
            min={0}
            value={graceMinutes}
            onChange={(e) => setGraceMinutes(Number(e.target.value))}
            className="ms-input w-full"
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="cron-alert" className="text-xs ms-app-muted">Alert channel (Slack webhook URL or &ldquo;pulse&rdquo;)</label>
        <input
          id="cron-alert"
          value={alertChannel}
          onChange={(e) => setAlertChannel(e.target.value)}
          placeholder="https://hooks.slack.com/services/… or pulse"
          className="ms-input w-full"
          disabled={loading}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="ms-btn ms-btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create job"}
        </button>
        {error && <span className="text-xs ms-app-error">{error}</span>}
      </div>
    </form>
  );
}
