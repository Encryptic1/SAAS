"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppSurface, LocalDevBanner } from "@market-standard/ui";

export default function DevPollPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("What should we prioritize next quarter?");
  const [optionsText, setOptionsText] = useState("Feature A\nFeature B\nFeature C");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const options = optionsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/dev/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create poll");
        return;
      }
      router.push("/?poll_created=true");
      router.refresh();
    } catch {
      setError("Could not reach API — is the DB gateway running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppSurface>
      <LocalDevBanner />
      <main className="ms-app-main max-w-lg">
        <a href="/" className="ms-app-link text-sm no-underline hover:underline">
          ← Back to home
        </a>
        <h1 className="ms-app-title mt-4">Local poll simulator</h1>
        <p className="mt-2 ms-app-muted">
          Create a poll in PGlite without Slack credentials. Data appears on the home page stats.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="question" className="ms-app-label">
              Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="ms-app-input"
              required
            />
          </div>
          <div>
            <label htmlFor="options" className="ms-app-label">
              Options (one per line)
            </label>
            <textarea
              id="options"
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={4}
              className="ms-app-textarea"
              required
            />
          </div>
          {error && <p className="text-sm ms-app-error">{error}</p>}
          <button type="submit" disabled={loading} className="ms-btn ms-btn-primary">
            {loading ? "Creating…" : "Create poll"}
          </button>
        </form>
      </main>
    </AppSurface>
  );
}
