"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@market-standard/ui";
import type { LinkRecord } from "../lib/links-data";

interface LinksManagerProps {
  initial: LinkRecord[];
  appUrl: string;
}

export function LinksManager({ initial, appUrl }: LinksManagerProps) {
  const [rows, setRows] = useState<LinkRecord[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [stripeUrl, setStripeUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/links");
    const data = (await res.json()) as { links?: LinkRecord[]; error?: string };
    if (res.ok && data.links) setRows(data.links);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slug || undefined, stripeUrl }),
      });
      const data = (await res.json()) as { error?: string; link?: LinkRecord };
      if (!res.ok) {
        setError(data.error ?? "Create failed");
        return;
      }
      setName("");
      setSlug("");
      setStripeUrl("");
      await reload();
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    await reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment link?")) return;
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    await reload();
  }

  async function copyShareUrl(s: string) {
    const url = `${appUrl}/go/${s}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`Copied: ${url}`);
    } catch {
      alert(url);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add payment link</CardTitle>
          <CardDescription>
            Paste any Stripe payment link URL. We&apos;ll generate a branded short link at{" "}
            <code className="ms-app-pre">{appUrl}/go/&lt;slug&gt;</code> that tracks clicks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="link-name" className="ms-app-label">Name</label>
              <input
                id="link-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ms-app-input"
                placeholder="Pro plan — annual"
                required
              />
            </div>
            <div>
              <label htmlFor="link-slug" className="ms-app-label">Slug (optional)</label>
              <input
                id="link-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="ms-app-input"
                placeholder="auto-generated from name"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="link-url" className="ms-app-label">Stripe payment link URL</label>
              <input
                id="link-url"
                type="url"
                value={stripeUrl}
                onChange={(e) => setStripeUrl(e.target.value)}
                className="ms-app-input"
                placeholder="https://buy.stripe.com/..."
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={loading} className="ms-btn ms-btn-primary">
                {loading ? "Creating…" : "Create link"}
              </button>
            </div>
          </form>
          {error && <p className="mt-2 text-sm text-[var(--color-breach)]">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>{rows.length} link(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<LinkRecord>
            data={rows}
            getRowKey={(r) => r.id}
            emptyMessage="No payment links yet."
            columns={[
              { key: "name", header: "Name", render: (r) => r.name },
              {
                key: "slug",
                header: "Share URL",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => copyShareUrl(r.slug)}
                    className="text-xs ms-app-link"
                    title="Click to copy"
                  >
                    {appUrl.replace(/^https?:\/\//, "")}/go/{r.slug}
                  </button>
                ),
              },
              { key: "clicks", header: "Clicks", render: (r) => r.clickCount.toLocaleString() },
              {
                key: "lastClickedAt",
                header: "Last click",
                render: (r) =>
                  r.lastClickedAt ? new Date(r.lastClickedAt).toLocaleDateString() : "—",
              },
              {
                key: "active",
                header: "Status",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => toggleActive(r.id, r.active)}
                    className="text-xs ms-app-link"
                  >
                    {r.active ? "Active" : "Paused"}
                  </button>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="text-xs text-[var(--color-breach)]"
                  >
                    Delete
                  </button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
