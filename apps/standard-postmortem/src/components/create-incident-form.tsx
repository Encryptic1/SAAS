"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SOURCE_LABELS: Record<string, string> = {
  hook: "Standard Hook",
  status: "Standard Status",
  pulse: "Suite Pulse",
  slack: "Slack",
  manual: "Manual",
};

export function CreateIncidentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("sev3");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  // Pre-fill from cross-sell deep links: ?source=hook&event_id=...&inbox_slug=...
  // or ?source=status&pipeline_id=...&pipeline_name=...
  // or ?source=pulse&blocker_text=...
  useEffect(() => {
    const src = searchParams.get("source");
    if (!src) return;

    const valid = ["hook", "status", "pulse", "slack"];
    if (!valid.includes(src)) return;

    setSource(src);

    const eventId = searchParams.get("event_id");
    const inboxSlug = searchParams.get("inbox_slug");
    const pipelineId = searchParams.get("pipeline_id");
    const pipelineName = searchParams.get("pipeline_name");
    const blockerText = searchParams.get("blocker_text");

    const notes: string[] = [];

    if (src === "hook" && (eventId || inboxSlug)) {
      notes.push(`Captured webhook event ${eventId ?? "(no id)"} from inbox ${inboxSlug ?? "(no slug)"}`);
      if (!title) setTitle(`Webhook failure from ${inboxSlug ?? "Hook inbox"}`);
      if (!summary) {
        const lines = ["Triggered from Standard Hook.", ""];
        if (eventId) lines.push(`Hook event: ${eventId}`);
        if (inboxSlug) lines.push(`Inbox slug: ${inboxSlug}`);
        lines.push("", "Timeline:");
        lines.push(`- ${new Date().toISOString()} — Event captured in Standard Hook inbox \`${inboxSlug ?? "?"}\``);
        setSummary(lines.join("\n"));
      }
    } else if (src === "status" && (pipelineId || pipelineName)) {
      notes.push(`Failed pipeline ${pipelineName ?? pipelineId ?? "(unknown)"}`);
      if (!title) setTitle(`CI failure: ${pipelineName ?? "pipeline"}`);
      if (!summary) {
        const lines = ["Triggered from Standard Status.", ""];
        if (pipelineName) lines.push(`Pipeline: ${pipelineName}`);
        if (pipelineId) lines.push(`Pipeline ID: ${pipelineId}`);
        lines.push("", "Root cause hypothesis:", "- _to be filled in_");
        setSummary(lines.join("\n"));
      }
    } else if (src === "pulse" && blockerText) {
      notes.push(`Standup blocker: ${blockerText.slice(0, 60)}${blockerText.length > 60 ? "…" : ""}`);
      if (!title) setTitle(`Blocker: ${blockerText.slice(0, 80)}`);
      if (!summary) {
        setSummary([
          "Triggered from Suite Pulse (standup blocker keyword match).",
          "",
          "Blocker text:",
          blockerText,
          "",
          "Root cause template:",
          "- What happened:",
          "- Impact:",
          "- How we found out:",
          "- What we did:",
          "- What we'll do next time:",
        ].join("\n"));
      }
    }

    if (notes.length > 0) setPrefillNote(notes.join(" · "));
  }, [searchParams, title, summary]);

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
      {prefillNote && (
        <div className="ms-app-card-inner border-l-2 border-[var(--color-flood)] px-3 py-2 text-xs">
          <span className="ms-app-muted">Pre-filled from </span>
          <span className="text-[var(--color-flood)] font-medium">{SOURCE_LABELS[source] ?? source}</span>
          <span className="ms-app-muted"> — {prefillNote}</span>
        </div>
      )}
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
          rows={6}
          className="ms-input font-mono text-xs"
        />
      </div>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading} className="ms-btn">
        {loading ? "Creating…" : "Create postmortem"}
      </button>
    </form>
  );
}
