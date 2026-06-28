"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable } from "@market-standard/ui";

interface PaymentLinkRow extends Record<string, unknown> {
  id: string;
  name: string;
  url: string;
  active: boolean;
  clickCount: number;
}

export function PaymentLinksManager() {
  const [rows, setRows] = useState<PaymentLinkRow[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-links");
      const data = (await res.json()) as { links?: PaymentLinkRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load links");
        return;
      }
      setRows(data.links ?? []);
      setError(null);
    } catch {
      setError("Could not load payment links");
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
    const res = await fetch("/api/payment-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    setName("");
    setUrl("");
    await load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/payment-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment link?")) return;
    await fetch(`/api/payment-links/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Payment Links</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Track Stripe payment links for your connected account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add link</CardTitle>
          <CardDescription>Name and URL for a payment link</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="link-name" className="ms-app-label">
                Name
              </label>
              <input
                id="link-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ms-app-input"
                required
              />
            </div>
            <div>
              <label htmlFor="link-url" className="ms-app-label">
                URL
              </label>
              <input
                id="link-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="ms-app-input"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="ms-btn ms-btn-primary">
                Create link
              </button>
            </div>
          </form>
          {error && <p className="mt-2 text-sm text-[var(--color-breach)]">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>{loading ? "Loading…" : `${rows.length} link(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<PaymentLinkRow>
            data={rows}
            getRowKey={(r) => r.id}
            emptyMessage="No payment links yet."
            columns={[
              { key: "name", header: "Name", render: (r) => r.name },
              {
                key: "url",
                header: "URL",
                render: (r) => (
                  <a href={r.url} target="_blank" rel="noreferrer" className="ms-app-link text-sm">
                    {r.url}
                  </a>
                ),
              },
              { key: "clicks", header: "Clicks", render: (r) => r.clickCount },
              {
                key: "active",
                header: "Status",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => toggleActive(r.id, r.active)}
                    className="text-xs ms-app-link"
                  >
                    {r.active ? "Active" : "Inactive"}
                  </button>
                ),
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <button type="button" onClick={() => handleDelete(r.id)} className="text-xs text-[var(--color-breach)]">
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
