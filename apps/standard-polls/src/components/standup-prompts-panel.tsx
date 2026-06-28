"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState } from "@market-standard/ui";

interface PromptRow extends Record<string, unknown> {
  id: string;
  channelId: string;
  scheduleCron: string;
  questions: string[];
  enabled: boolean;
}

export function StandupPromptsPanel() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [channelId, setChannelId] = useState("C_GENERAL");
  const [scheduleCron, setScheduleCron] = useState("0 9 * * 1-5");
  const [questionsText, setQuestionsText] = useState(
    "What did you do yesterday?\nWhat will you do today?\nAny blockers?",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/standup/prompts");
      const data = (await res.json()) as { prompts?: PromptRow[] };
      setPrompts(data.prompts ?? []);
    } catch {
      setError("Could not load standup prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const questions = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    const res = await fetch("/api/standup/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, scheduleCron, questions }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Create failed");
      return;
    }

    await load();
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    await fetch(`/api/standup/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Standup prompts</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Schedule automated standup questions posted to Slack channels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New prompt schedule</CardTitle>
          <CardDescription>Cron schedule uses UTC (default: weekdays at 9am)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="channel" className="ms-app-label">
                Slack channel ID
              </label>
              <input
                id="channel"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="ms-app-input"
                required
              />
            </div>
            <div>
              <label htmlFor="cron" className="ms-app-label">
                Schedule (cron)
              </label>
              <input
                id="cron"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                className="ms-app-input"
                required
              />
            </div>
            <div>
              <label htmlFor="questions" className="ms-app-label">
                Questions (one per line)
              </label>
              <textarea
                id="questions"
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                rows={4}
                className="ms-app-textarea"
                required
              />
            </div>
            <button type="submit" className="ms-btn ms-btn-primary">
              Create prompt
            </button>
            {error && <p className="text-sm text-[var(--color-breach)]">{error}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled prompts</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${prompts.length} prompt(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <EmptyState title="No standup prompts" description="Create a schedule above to get started." />
          ) : (
            <DataTable<PromptRow>
              data={prompts}
              getRowKey={(r) => r.id}
              columns={[
                { key: "channel", header: "Channel", render: (r) => r.channelId },
                { key: "cron", header: "Schedule", render: (r) => r.scheduleCron },
                {
                  key: "questions",
                  header: "Questions",
                  render: (r) => `${r.questions.length} question(s)`,
                },
                {
                  key: "enabled",
                  header: "Status",
                  render: (r) => (
                    <button
                      type="button"
                      onClick={() => toggleEnabled(r.id, r.enabled)}
                      className="text-xs ms-app-link"
                    >
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
