"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";

export function SettingsPanel() {
  const [showBadge, setShowBadge] = useState(true);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings");
      const data = (await res.json()) as {
        showBadge?: boolean;
        slackTeamName?: string | null;
        plan?: string;
      };
      setShowBadge(data.showBadge ?? true);
      setTeamName(data.slackTeamName ?? null);
      setPlan(data.plan ?? "free");
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showBadge }),
    });
    setSaving(false);
    setMessage(res.ok ? "Settings saved." : "Could not save settings.");
  }

  if (loading) {
    return <p className="text-sm text-[var(--text-mist)]">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Workspace preferences for {teamName ?? "your Slack workspace"}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>Plan: {plan}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-[var(--text-foam)]">
              <input
                type="checkbox"
                checked={showBadge}
                onChange={(e) => setShowBadge(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-flood)]"
              />
              Show &quot;Powered by Market Standard&quot; badge on poll messages
            </label>
            <button type="submit" disabled={saving} className="ms-btn ms-btn-primary">
              {saving ? "Saving…" : "Save settings"}
            </button>
            {message && <p className="text-sm text-[var(--color-flood)]">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
