"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateInboxForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create inbox");
        return;
      }
      setName("");
      setSlug("");
      router.refresh();
      if (data.id) router.push(`/dashboard/inboxes/${data.id}`);
    } catch {
      setError("Could not create inbox");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="ms-app-label">
          Inbox name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="ms-app-input"
          placeholder="Stripe webhooks"
          required
        />
      </div>
      <div>
        <label htmlFor="slug" className="ms-app-label">
          URL slug (optional)
        </label>
        <input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="ms-app-input"
          placeholder="stripe-dev"
        />
      </div>
      <button type="submit" disabled={loading} className="ms-btn ms-btn-primary">
        {loading ? "Creating…" : "Create inbox"}
      </button>
      {error && <p className="text-sm ms-app-error">{error}</p>}
    </form>
  );
}
