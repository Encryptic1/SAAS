"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TimelineEntry = { at: string; text: string };
type Sections = { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string };

type Incident = {
  id: string;
  title: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
  summary: string | null;
  rootcauseMd: string | null;
  timeline: TimelineEntry[] | null;
  sections: Sections | null;
  status: string;
  source: string | null;
};

type ActionItem = {
  id: string;
  body: string;
  dueAt: string | null;
  completedAt: string | null;
};

type RecurrenceLink = {
  id: string;
  fromIncidentId: string;
  toIncidentId: string;
  similarityNote: string | null;
};

type Suggestion = {
  fromId: string;
  toId: string;
  fromTitle: string;
  toTitle: string;
  similarity: number;
};

const SEVERITIES = [
  { value: "sev1", label: "SEV1 — Critical outage" },
  { value: "sev2", label: "SEV2 — Major degradation" },
  { value: "sev3", label: "SEV3 — Minor degradation" },
  { value: "sev4", label: "SEV4 — Nuisance / cosmetic" },
];

const STATUSES = ["draft", "investigating", "resolved", "archived"];

export function PostmortemEditor({
  incident,
  actionItems,
  recurrenceLinks,
  suggestions,
  allIncidents,
}: {
  incident: Incident;
  actionItems: ActionItem[];
  recurrenceLinks: RecurrenceLink[];
  suggestions: Suggestion[];
  allIncidents: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(incident.title);
  const [severity, setSeverity] = useState(incident.severity);
  const [status, setStatus] = useState(incident.status);
  const [summary, setSummary] = useState(incident.summary ?? "");
  const [rootcauseMd, setRootcauseMd] = useState(incident.rootcauseMd ?? "");
  const [timeline, setTimeline] = useState<TimelineEntry[]>(incident.timeline ?? []);
  const [sections, setSections] = useState<Sections>(
    incident.sections ?? { whatWentWell: "", whatDidnt: "", whereWeGotLucky: "" },
  );
  const [newActionBody, setNewActionBody] = useState("");
  const [newActionDue, setNewActionDue] = useState("");
  const [saveState, setSaveState] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState("");

  // Debounced autosave of the long-form fields
  useEffect(() => {
    const t = setTimeout(() => {
      void save(false);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, severity, status, summary, rootcauseMd, timeline, sections]);

  async function save(showFeedback: boolean) {
    if (showFeedback) setSaveState("Saving…");
    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          severity,
          status,
          summary: summary || null,
          rootcauseMd: rootcauseMd || null,
          timeline,
          sections,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setSaveState(`Error: ${d.error ?? "save failed"}`);
        return;
      }
      if (showFeedback) setSaveState("Saved");
      else setSaveState(null);
    } catch {
      setSaveState("Network error");
    }
  }

  function addTimelineEntry() {
    setTimeline((cur) => [...cur, { at: new Date().toISOString(), text: "" }]);
  }

  function updateTimelineEntry(idx: number, patch: Partial<TimelineEntry>) {
    setTimeline((cur) => cur.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }

  function removeTimelineEntry(idx: number) {
    setTimeline((cur) => cur.filter((_, i) => i !== idx));
  }

  async function addAction() {
    if (!newActionBody) return;
    const res = await fetch(`/api/incidents/${incident.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newActionBody, dueAt: newActionDue || undefined }),
    });
    if (res.ok) {
      setNewActionBody("");
      setNewActionDue("");
      router.refresh();
    }
  }

  async function toggleAction(action: ActionItem) {
    await fetch(`/api/actions/${action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completedAt: action.completedAt ? null : new Date().toISOString(),
      }),
    });
    router.refresh();
  }

  async function deleteAction(actionId: string) {
    await fetch(`/api/actions/${actionId}`, { method: "DELETE" });
    router.refresh();
  }

  async function addLink() {
    if (!linkTarget) return;
    await fetch(`/api/incidents/${incident.id}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toIncidentId: linkTarget }),
    });
    setLinkTarget("");
    router.refresh();
  }

  async function removeLink(linkId: string) {
    await fetch(`/api/links/${linkId}`, { method: "DELETE" });
    router.refresh();
  }

  const linkedIds = new Set([
    ...recurrenceLinks.map((l) => (l.fromIncidentId === incident.id ? l.toIncidentId : l.fromIncidentId)),
  ]);
  const applicableSuggestions = suggestions.filter(
    (s) =>
      (s.fromId === incident.id || s.toId === incident.id) &&
      !linkedIds.has(s.fromId === incident.id ? s.toId : s.fromId),
  );
  const otherIncidents = allIncidents.filter((i) => i.id !== incident.id && !linkedIds.has(i.id));

  return (
    <div className="space-y-6">
      <div className="ms-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="ms-input flex-1 text-lg font-semibold"
          />
          <button type="button" onClick={() => save(true)} className="ms-btn">
            Save
          </button>
          {saveState && <span className="text-xs ms-app-muted">{saveState}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="ms-label">Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="ms-input">
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="ms-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ms-input">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ms-card p-5 space-y-2">
        <label className="ms-label">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="ms-input"
          placeholder="One-paragraph description of what happened and who was affected."
        />
      </div>

      <div className="ms-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="ms-label">Timeline</label>
          <button type="button" onClick={addTimelineEntry} className="ms-btn-ghost text-xs">+ Add entry</button>
        </div>
        <div className="space-y-2">
          {timeline.length === 0 && (
            <p className="text-xs ms-app-muted">No timeline entries yet. Add the alert, the diagnosis, the mitigation, and the resolution.</p>
          )}
          {timeline.map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="datetime-local"
                value={toDatetimeLocal(t.at)}
                onChange={(e) => updateTimelineEntry(i, { at: new Date(e.target.value).toISOString() })}
                className="ms-input w-48 text-xs"
              />
              <input
                value={t.text}
                onChange={(e) => updateTimelineEntry(i, { text: e.target.value })}
                className="ms-input flex-1 text-sm"
                placeholder="What happened at this moment"
              />
              <button type="button" onClick={() => removeTimelineEntry(i)} className="ms-btn-ghost text-xs ms-app-danger">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="ms-card p-5 space-y-2">
        <label className="ms-label">Root cause (markdown)</label>
        <textarea
          value={rootcauseMd}
          onChange={(e) => setRootcauseMd(e.target.value)}
          rows={8}
          className="ms-input font-mono text-sm"
          placeholder="The underlying cause — not the symptom. Be specific about the mechanism."
        />
        <p className="text-xs ms-app-muted">
          This field powers recurrence detection — similar root causes across incidents will be surfaced as suggestions.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="ms-card p-4 space-y-2">
          <label className="ms-label">What went well</label>
          <textarea
            value={sections.whatWentWell}
            onChange={(e) => setSections((s) => ({ ...s, whatWentWell: e.target.value }))}
            rows={4}
            className="ms-input text-sm"
          />
        </div>
        <div className="ms-card p-4 space-y-2">
          <label className="ms-label">What didn't go well</label>
          <textarea
            value={sections.whatDidnt}
            onChange={(e) => setSections((s) => ({ ...s, whatDidnt: e.target.value }))}
            rows={4}
            className="ms-input text-sm"
          />
        </div>
        <div className="ms-card p-4 space-y-2">
          <label className="ms-label">Where we got lucky</label>
          <textarea
            value={sections.whereWeGotLucky}
            onChange={(e) => setSections((s) => ({ ...s, whereWeGotLucky: e.target.value }))}
            rows={4}
            className="ms-input text-sm"
          />
        </div>
      </div>

      <div className="ms-card p-5 space-y-3">
        <label className="ms-label">Action items</label>
        <div className="space-y-2">
          {actionItems.length === 0 && (
            <p className="text-xs ms-app-muted">No action items yet. Add concrete, owned, dated follow-ups.</p>
          )}
          {actionItems.map((a) => (
            <div key={a.id} className="flex gap-2 items-center ms-row p-2 rounded border border-white/5">
              <input
                type="checkbox"
                checked={!!a.completedAt}
                onChange={() => toggleAction(a)}
                className="ms-checkbox"
              />
              <span className={`flex-1 text-sm ${a.completedAt ? "line-through ms-app-muted" : ""}`}>{a.body}</span>
              {a.dueAt && (
                <span className="text-xs ms-app-muted">due {new Date(a.dueAt).toLocaleDateString()}</span>
              )}
              <button type="button" onClick={() => deleteAction(a.id)} className="ms-btn-ghost text-xs ms-app-danger">×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newActionBody}
            onChange={(e) => setNewActionBody(e.target.value)}
            placeholder="Add an action item…"
            className="ms-input flex-1 text-sm"
          />
          <input
            type="date"
            value={newActionDue}
            onChange={(e) => setNewActionDue(e.target.value)}
            className="ms-input w-40 text-sm"
          />
          <button type="button" onClick={addAction} className="ms-btn">Add</button>
        </div>
      </div>

      <div className="ms-card p-5 space-y-3">
        <label className="ms-label">Recurrence links</label>
        <p className="text-xs ms-app-muted">
          Link this incident to similar past incidents so the pattern is visible. Suggestions are computed from root-cause similarity.
        </p>
        {recurrenceLinks.length > 0 && (
          <div className="space-y-1">
            {recurrenceLinks.map((l) => {
              const otherId = l.fromIncidentId === incident.id ? l.toIncidentId : l.fromIncidentId;
              const otherTitle = allIncidents.find((i) => i.id === otherId)?.title ?? otherId;
              return (
                <div key={l.id} className="flex items-center justify-between ms-row p-2 rounded border border-white/5">
                  <a href={`/dashboard/${otherId}`} className="text-sm hover:underline">↻ {otherTitle}</a>
                  {l.similarityNote && <span className="text-xs ms-app-muted">{l.similarityNote}</span>}
                  <button type="button" onClick={() => removeLink(l.id)} className="ms-btn-ghost text-xs ms-app-danger">unlink</button>
                </div>
              );
            })}
          </div>
        )}
        {applicableSuggestions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold mt-2">Suggestions</p>
            {applicableSuggestions.slice(0, 5).map((s) => {
              const otherId = s.fromId === incident.id ? s.toId : s.fromId;
              const otherTitle = s.fromId === incident.id ? s.toTitle : s.fromTitle;
              return (
                <div key={`${s.fromId}-${s.toId}`} className="flex items-center justify-between ms-row p-2 rounded border border-amber-500/20">
                  <span className="text-sm">Looks like <a href={`/dashboard/${otherId}`} className="hover:underline">{otherTitle}</a></span>
                  <span className="text-xs ms-app-muted">{Math.round(s.similarity * 100)}% similar</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/incidents/${incident.id}/links`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ toIncidentId: otherId, similarityNote: "Auto-suggested from root-cause similarity" }),
                      });
                      router.refresh();
                    }}
                    className="ms-btn-ghost text-xs"
                  >
                    link
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <select value={linkTarget} onChange={(e) => setLinkTarget(e.target.value)} className="ms-input flex-1 text-sm">
            <option value="">Link to another incident…</option>
            {otherIncidents.map((i) => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>
          <button type="button" onClick={addLink} disabled={!linkTarget} className="ms-btn">Link</button>
        </div>
      </div>
    </div>
  );
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
