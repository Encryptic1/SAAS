"use client";

import { useState } from "react";

interface ReplayEventButtonProps {
  eventId: string;
}

export function ReplayEventButton({ eventId }: ReplayEventButtonProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReplay() {
    if (!url.trim()) {
      setError("Replay URL required");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/events/${eventId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as { status?: number; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Replay failed");
        return;
      }
      setMessage(`Replayed — upstream responded ${data.status ?? "ok"}`);
    } catch {
      setError("Replay failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="ms-app-input text-sm"
        placeholder="https://your-app.com/webhooks/replay"
      />
      <button type="button" onClick={handleReplay} disabled={loading} className="ms-btn text-sm">
        {loading ? "Replaying…" : "Replay to URL"}
      </button>
      {message && <p className="text-xs ms-app-success">{message}</p>}
      {error && <p className="text-xs ms-app-error">{error}</p>}
    </div>
  );
}
