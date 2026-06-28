"use client";

import { useState } from "react";
import { Badge } from "@market-standard/ui";
import type { Tunnel } from "@/lib/workspace-data";

export function TunnelsList({ tunnels }: { tunnels: Tunnel[] }) {
  if (tunnels.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="ms-app-muted text-sm">No tunnels configured.</p>
        <p className="ms-app-muted text-xs mt-1">
          Create one so external webhooks reach your local intake routes.
        </p>
      </div>
    );
  }
  return (
    <div className="ms-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase opacity-60">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Target</th>
            <th className="p-3">Provider</th>
            <th className="p-3">Public URL</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {tunnels.map((t) => (
            <tr key={t.id} className="border-t border-[var(--hairline)]">
              <td className="p-3 font-medium">{t.name}</td>
              <td className="p-3 opacity-70 text-xs font-mono">{t.targetApp}{t.targetPath}</td>
              <td className="p-3 opacity-70 text-xs">{t.provider}</td>
              <td className="p-3 text-xs font-mono">
                {t.publicUrl ? <a className="ms-app-link" href={t.publicUrl} target="_blank" rel="noreferrer">{t.publicUrl}</a> : "—"}
              </td>
              <td className="p-3">
                <Badge variant={t.status === "active" ? "success" : t.status === "error" ? "danger" : "neutral"} dot>{t.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CreateTunnelForm() {
  const [name, setName] = useState("");
  const [targetApp, setTargetApp] = useState("standard-hook");
  const [targetPath, setTargetPath] = useState("/api/capture");
  const [provider, setProvider] = useState("cloudflare");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tunnels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, targetApp, targetPath, provider, status: "inactive" }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error ?? "Failed to create tunnel");
      }
      setName("");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="ms-card p-4 space-y-3" onSubmit={onSubmit}>
      <p className="font-semibold text-sm">Add tunnel</p>
      <input
        className="ms-input"
        placeholder="Tunnel name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <select className="ms-input" value={targetApp} onChange={(e) => setTargetApp(e.target.value)}>
          {["standard-hook", "standard-status", "standard-postmortem", "standard-vault", "standard-polls"].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input className="ms-input" placeholder="/api/capture" value={targetPath} onChange={(e) => setTargetPath(e.target.value)} />
      </div>
      <select className="ms-input" value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="cloudflare">cloudflare</option>
        <option value="localhost">localhost</option>
        <option value="ngrok">ngrok</option>
      </select>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      <button type="submit" className="ms-btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create tunnel"}
      </button>
    </form>
  );
}
