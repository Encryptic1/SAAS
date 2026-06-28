"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import type { DigestSource } from "@/lib/suite-digest";

interface DigestConfigRow {
  id: string;
  frequency: "daily" | "weekly" | "off";
  sources: DigestSource[];
  slackChannelId: string | null;
  enabled: boolean;
  lastSentAt: string | null;
}

interface Channel {
  id: string;
  name: string;
}

const ALL_SOURCES: Array<{ id: DigestSource; label: string; description: string }> = [
  { id: "polls", label: "Standard Polls", description: "New polls, total votes, top poll" },
  { id: "metrics", label: "Standard Metrics", description: "MRR, ARR, active subs, churn, delta" },
  { id: "links", label: "Standard Links", description: "Total links, clicks in window, top link" },
  { id: "floodg8", label: "FloodG8 Suite Pulse", description: "Agent reports, AI spend, top agent" },
  { id: "syncdevtime", label: "SyncDevTime", description: "Engineering hours, top project" },
];

const FREQUENCIES: Array<{ value: DigestConfigRow["frequency"]; label: string; hint: string }> = [
  { value: "off", label: "Off", hint: "No automated digest" },
  { value: "daily", label: "Daily", hint: "Posted every morning (Starter+)" },
  { value: "weekly", label: "Weekly", hint: "Posted every Monday (Free)" },
];

export function DigestConfigPanel() {
  const [config, setConfig] = useState<DigestConfigRow | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/digest/config");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { config: DigestConfigRow; channels: Channel[] };
      setConfig(data.config);
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load digest config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function clearTransient() {
    setSuccess(null);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    clearTransient();
    try {
      const res = await fetch("/api/digest/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: config.frequency,
          sources: config.sources,
          slackChannelId: config.slackChannelId,
          enabled: config.enabled,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { config: DigestConfigRow };
      setConfig(data.config);
      setSuccess("Digest config saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestDigest() {
    setSending(true);
    clearTransient();
    try {
      const res = await fetch("/api/cron/digest?preview=1", {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { previews?: Array<{ blocks: unknown[]; channelId?: string }> };
      const first = data.previews?.[0];
      setPreview(first ? JSON.stringify(first.blocks, null, 2) : null);
      setSuccess(`Composed ${data.previews?.length ?? 0} preview(s) — see below.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test digest failed");
    } finally {
      setSending(false);
    }
  }

  function toggleSource(id: DigestSource) {
    if (!config) return;
    const next = config.sources.includes(id)
      ? config.sources.filter((s) => s !== id)
      : [...config.sources, id];
    setConfig({ ...config, sources: next });
  }

  if (loading || !config) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="ms-dash-page-title">Suite Digest</h1>
          <p className="mt-1 text-sm text-[var(--text-mist)]">Loading digest configuration…</p>
        </div>
        <Card>
          <CardContent>
            <div className="ms-dash-skeleton h-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Suite Digest</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Daily or weekly Slack summary of MRR, FloodG8 runs, SyncDevTime hours, polls, and standup blockers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
            <CardDescription>Choose frequency and Slack destination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="ms-app-label">Frequency</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {FREQUENCIES.map((f) => {
                  const active = config.frequency === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setConfig({ ...config, frequency: f.value })}
                      className={
                        "ms-dash-frequency-card" + (active ? " ms-dash-frequency-card-active" : "")
                      }
                      aria-pressed={active}
                    >
                      <span className="ms-dash-frequency-label">{f.label}</span>
                      <span className="ms-dash-frequency-hint">{f.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="channel" className="ms-app-label">
                Slack channel
              </label>
              {channels.length > 0 ? (
                <select
                  id="channel"
                  value={config.slackChannelId ?? ""}
                  onChange={(e) => setConfig({ ...config, slackChannelId: e.target.value || null })}
                  className="ms-app-input"
                >
                  <option value="">Select a channel…</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="channel"
                  type="text"
                  value={config.slackChannelId ?? ""}
                  onChange={(e) => setConfig({ ...config, slackChannelId: e.target.value || null })}
                  placeholder="#suite-digest"
                  className="ms-app-input"
                />
              )}
              <p className="mt-1 text-xs text-[var(--text-mist)]">
                {channels.length > 0
                  ? "Channels fetched from your connected Slack workspace."
                  : "Connect Slack in Settings to populate the channel picker, or paste a channel ID or name."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="enabled" className="ms-app-label mb-0">
                Enabled
              </label>
              <input
                id="enabled"
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="ms-app-checkbox"
              />
              <span className="text-xs text-[var(--text-mist)]">
                When off, the cron skips this workspace.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Pick which suite products contribute to the digest.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_SOURCES.map((s) => {
                const on = config.sources.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSource(s.id)}
                    className={"ms-dash-source-card" + (on ? " ms-dash-source-card-active" : "")}
                    aria-pressed={on}
                  >
                    <div className="ms-dash-source-card-head">
                      <span className="ms-dash-source-card-title">{s.label}</span>
                      <span className={"ms-dash-source-card-dot" + (on ? " ms-dash-source-card-dot-on" : "")} />
                    </div>
                    <span className="ms-dash-source-card-desc">{s.description}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="ms-btn ms-btn-primary">
            {saving ? "Saving…" : "Save configuration"}
          </button>
          <button
            type="button"
            onClick={handleTestDigest}
            disabled={sending}
            className="ms-btn ms-btn-secondary"
          >
            {sending ? "Composing…" : "Send test digest"}
          </button>
          {success && <span className="text-sm text-[var(--color-flood)]">{success}</span>}
          {error && <span className="text-sm text-[var(--color-breach)]">{error}</span>}
        </div>
      </form>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Last preview payload</CardTitle>
            <CardDescription>Slack Block Kit the cron would post.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="ms-dash-pre">{preview}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent sends</CardTitle>
          <CardDescription>Last digest posts from the cron.</CardDescription>
        </CardHeader>
        <CardContent>
          {config.lastSentAt ? (
            <p className="text-sm">
              Last sent: <span className="ms-app-mono">{new Date(config.lastSentAt).toLocaleString()}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--text-mist)]">
              No digests sent yet. Use “Send test digest” to verify the composed payload, then enable
              the cron in your Vercel project.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
