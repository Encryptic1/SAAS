"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import type { QuotaSnapshot } from "../lib/metrics-data";

interface QuotaManagerProps {
  initial: QuotaSnapshot[];
}

const SOURCE_COLORS: Record<string, string> = {
  stripe: "var(--color-flood)",
  slack: "var(--color-flood-soft)",
  github: "var(--text-foam)",
  supabase: "var(--color-flood)",
  openai: "var(--color-caution)",
  anthropic: "var(--color-breach)",
  vercel: "var(--text-foam)",
  resend: "var(--color-flood-soft)",
};

function pct(used: number, limit: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function severity(p: number): "ok" | "warn" | "critical" {
  if (p >= 90) return "critical";
  if (p >= 70) return "warn";
  return "ok";
}

const SEVERITY_COLOR: Record<"ok" | "warn" | "critical", string> = {
  ok: "var(--color-flood)",
  warn: "var(--color-caution)",
  critical: "var(--color-breach)",
};

export function QuotaManager({ initial }: QuotaManagerProps) {
  const [snapshots] = useState<QuotaSnapshot[]>(initial);
  const emit = useCallback(async () => {
    const form = document.getElementById("quota-sample-form") as HTMLFormElement | null;
    if (!form) return;
    const fd = new FormData(form);
    const payload = {
      source: String(fd.get("source") ?? ""),
      quotaLabel: String(fd.get("quotaLabel") ?? ""),
      used: Number(fd.get("used") ?? 0),
      limit: fd.get("limit") ? Number(fd.get("limit")) : null,
      windowStartedAt: new Date().toISOString(),
      windowEndsAt: fd.get("windowEndsAt")
        ? new Date(String(fd.get("windowEndsAt"))).toISOString()
        : null,
      metadata: {},
    };
    if (!payload.source || !payload.quotaLabel) return;
    await fetch("/api/quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    form.reset();
    window.location.reload();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {snapshots.map((s) => {
          const latest = s.samples[0];
          if (!latest) return null;
          const p = pct(latest.used, latest.limit);
          const sev = severity(p);
          const color = SEVERITY_COLOR[sev];
          return (
            <Card key={s.source}>
              <CardHeader>
                <CardTitle>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: SOURCE_COLORS[s.source] ?? "var(--text-mist)",
                      marginRight: 8,
                    }}
                  />
                  {s.source}
                </CardTitle>
                <CardDescription>{latest.quotaLabel} · sampled {new Date(latest.sampledAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-[var(--text-foam)]">
                      {latest.used.toLocaleString()}
                      {latest.limit ? ` / ${latest.limit.toLocaleString()}` : " / ∞"}
                    </span>
                    {latest.limit && (
                      <span style={{ color }} className="text-sm font-medium">
                        {p}% used
                      </span>
                    )}
                  </div>
                  {latest.limit && (
                    <div style={{ height: 6, background: "var(--bg-deep)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${p}%`, height: "100%", background: color }} />
                    </div>
                  )}
                  <p className="text-xs text-[var(--text-mist)]">
                    Window: {new Date(latest.windowStartedAt).toLocaleString()}
                    {latest.windowEndsAt ? ` → ${new Date(latest.windowEndsAt).toLocaleString()}` : ""}
                  </p>
                  {s.samples.length > 1 && (
                    <p className="text-xs text-[var(--text-mist)]">{s.samples.length} samples in retention window</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record manual sample</CardTitle>
          <CardDescription>
            Useful for ad-hoc checks. For continuous monitoring, POST to <code className="ms-app-pre">/api/quota</code> from your cron.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="quota-sample-form" className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="q-source" className="ms-app-label">Source</label>
              <select id="q-source" name="source" className="ms-app-input" required defaultValue="stripe">
                <option value="stripe">Stripe</option>
                <option value="slack">Slack</option>
                <option value="github">GitHub</option>
                <option value="supabase">Supabase</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="vercel">Vercel</option>
                <option value="resend">Resend</option>
              </select>
            </div>
            <div>
              <label htmlFor="q-label" className="ms-app-label">Quota label</label>
              <input id="q-label" name="quotaLabel" className="ms-app-input" placeholder="e.g. API requests / minute" required />
            </div>
            <div>
              <label htmlFor="q-used" className="ms-app-label">Used</label>
              <input id="q-used" name="used" type="number" min={0} className="ms-app-input" required defaultValue={0} />
            </div>
            <div>
              <label htmlFor="q-limit" className="ms-app-label">Limit (blank = unlimited)</label>
              <input id="q-limit" name="limit" type="number" min={0} className="ms-app-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="q-ends" className="ms-app-label">Window ends at (optional)</label>
              <input id="q-ends" name="windowEndsAt" type="datetime-local" className="ms-app-input" />
            </div>
            <div className="sm:col-span-2">
              <button type="button" onClick={emit} className="ms-btn ms-btn-primary">
                Record sample
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
