"use client";

import { useState, useTransition } from "react";

interface SecretRow {
  id: string;
  key: string;
  version: number;
  agentReference: boolean;
  notes: string | null;
  lastRotatedAt: string | null;
  valueHash: string | null;
}

interface TokenMeta {
  id: string;
  name: string;
  last4: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ProjectDetailManagerProps {
  projectId: string;
  initialSecrets: SecretRow[];
  initialTokens: TokenMeta[];
  initialAudit: Array<{
    id: string;
    action: string;
    actor: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
}

export function ProjectDetailManager({
  projectId,
  initialSecrets,
  initialTokens,
  initialAudit,
}: ProjectDetailManagerProps) {
  const [secrets, setSecrets] = useState<SecretRow[]>(initialSecrets);
  const [tokens, setTokens] = useState<TokenMeta[]>(initialTokens);
  const [audit] = useState(initialAudit);
  const [pending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [agentRef, setAgentRef] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"env" | "doppler">("env");

  const [tokenName, setTokenName] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState<number | "">("");
  const [newToken, setNewToken] = useState<string | null>(null);

  async function addSecret(event: React.FormEvent) {
    event.preventDefault();
    if (!newKey.trim() || !newValue) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue,
          agentReference: agentRef,
        }),
      });
      const data = (await res.json()) as { secret?: SecretRow; error?: string };
      if (!res.ok || !data.secret) {
        setError(data.error ?? "Failed to add secret");
        return;
      }
      setSecrets((prev) => [...prev.filter((s) => s.key !== data.secret!.key), data.secret!].sort((a, b) => a.key.localeCompare(b.key)));
      setNewKey("");
      setNewValue("");
      setAgentRef(false);
      setSuccess(`Added ${data.secret.key}`);
    } catch {
      setError("Could not add secret");
    }
  }

  async function rotateSecret(secret: SecretRow) {
    const next = window.prompt(`New value for ${secret.key}:`);
    if (next === null) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/secrets/${secret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, value: next }),
      });
      const data = (await res.json()) as { secret?: SecretRow; error?: string };
      if (!res.ok || !data.secret) {
        setError(data.error ?? "Failed to rotate");
        return;
      }
      setSecrets((prev) => prev.map((s) => (s.id === secret.id ? data.secret! : s)));
      setSuccess(`Rotated ${secret.key} (v${data.secret.version})`);
    } catch {
      setError("Could not rotate secret");
    }
  }

  async function toggleAgentReference(secret: SecretRow) {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/secrets/${secret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, agentReference: !secret.agentReference }),
      });
      const data = (await res.json()) as { secret?: SecretRow; error?: string };
      if (!res.ok || !data.secret) {
        setError(data.error ?? "Failed to update");
        return;
      }
      setSecrets((prev) => prev.map((s) => (s.id === secret.id ? data.secret! : s)));
      setSuccess(`${secret.key}: agent reference ${data.secret.agentReference ? "enabled" : "disabled"}`);
    } catch {
      setError("Could not update secret");
    }
  }

  async function deleteSecretRow(secret: SecretRow) {
    if (!window.confirm(`Delete ${secret.key}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/secrets/${secret.id}?projectId=${projectId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to delete");
        return;
      }
      setSecrets((prev) => prev.filter((s) => s.id !== secret.id));
      setSuccess(`Deleted ${secret.key}`);
    } catch {
      setError("Could not delete secret");
    }
  }

  async function importEnv(event: React.FormEvent) {
    event.preventDefault();
    if (!importText.trim()) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: importFormat, content: importText }),
        });
        const data = (await res.json()) as {
          created?: number;
          skipped?: number;
          errors?: number;
          error?: string;
          createdKeys?: string[];
          skippedKeys?: string[];
          errorDetails?: string[];
        };
        if (!res.ok) {
          setError(data.error ?? "Import failed");
          return;
        }
        setSuccess(`Imported ${data.created} new, ${data.skipped} skipped, ${data.errors} errors`);
        // Refresh secrets
        const secretsRes = await fetch(`/api/projects/${projectId}/secrets`);
        const secretsData = (await secretsRes.json()) as { secrets?: SecretRow[] };
        if (secretsData.secrets) setSecrets(secretsData.secrets);
        setImportText("");
      } catch {
        setError("Could not import");
      }
    });
  }

  async function createToken(event: React.FormEvent) {
    event.preventDefault();
    if (!tokenName.trim()) return;
    setError(null);
    setNewToken(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName.trim(),
          scopes: ["read"],
          expiresInDays: tokenExpiry === "" ? null : Number(tokenExpiry),
        }),
      });
      const data = (await res.json()) as { token?: string; tokenMeta?: TokenMeta; error?: string };
      if (!res.ok || !data.token) {
        setError(data.error ?? "Failed to mint token");
        return;
      }
      setNewToken(data.token);
      setTokenName("");
      setTokenExpiry("");
      // Refresh tokens
      const tokensRes = await fetch(`/api/projects/${projectId}/tokens`);
      const tokensData = (await tokensRes.json()) as { tokens?: TokenMeta[] };
      if (tokensData.tokens) setTokens(tokensData.tokens);
    } catch {
      setError("Could not mint token");
    }
  }

  async function revokeToken(token: TokenMeta) {
    if (!window.confirm(`Revoke token ${token.name} (…${token.last4})?`)) return;
    try {
      await fetch(`/api/tokens/${token.id}`, { method: "DELETE" });
      setTokens((prev) => prev.filter((t) => t.id !== token.id));
    } catch {
      setError("Could not revoke token");
    }
  }

  return (
    <div className="space-y-6">
      <section className="ms-card p-4">
        <h3 className="font-semibold mb-3">Secrets ({secrets.length})</h3>
        {secrets.length === 0 ? (
          <p className="ms-mono text-xs text-[var(--text-fog)]">No secrets yet. Add one below or import an .env file.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="ms-mono-eyebrow text-left">
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">v</th>
                <th className="py-2 pr-3">Agent ref</th>
                <th className="py-2 pr-3">Last rotated</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((s) => (
                <tr key={s.id} className="border-t border-[var(--hairline)]">
                  <td className="py-2 pr-3 font-mono">{s.key}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{s.version}</td>
                  <td className="py-2 pr-3">
                    <button
                      type="button"
                      onClick={() => toggleAgentReference(s)}
                      className={`ms-chip ${s.agentReference ? "ms-chip-on" : ""}`}
                      title="Toggle AI-agent reference mode"
                    >
                      {s.agentReference ? "yes" : "no"}
                    </button>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-[var(--text-fog)]">
                    {s.lastRotatedAt ? new Date(s.lastRotatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right space-x-2">
                    <button type="button" onClick={() => rotateSecret(s)} className="ms-btn-sm">
                      Rotate
                    </button>
                    <button type="button" onClick={() => deleteSecretRow(s)} className="ms-btn-sm ms-btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="ms-card p-4 space-y-3">
        <h3 className="font-semibold">Add secret</h3>
        <form onSubmit={addSecret} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block space-y-1 md:col-span-1">
              <span className="ms-mono-eyebrow">Key</span>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="DATABASE_URL"
                className="ms-input"
                required
              />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="ms-mono-eyebrow">Value (encrypted at rest)</span>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="postgres://…"
                className="ms-input"
                required
                type="password"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agentRef}
              onChange={(e) => setAgentRef(e.target.checked)}
            />
            <span>Allow AI agents to see this key exists (without value)</span>
          </label>
          <button type="submit" disabled={!newKey.trim() || !newValue} className="ms-btn">
            Add secret
          </button>
        </form>
      </section>

      <section className="ms-card p-4 space-y-3">
        <h3 className="font-semibold">Import .env / Doppler JSON</h3>
        <form onSubmit={importEnv} className="space-y-3">
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={importFormat === "env"}
                onChange={() => setImportFormat("env")}
              />
              <span>.env</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={importFormat === "doppler"}
                onChange={() => setImportFormat("doppler")}
              />
              <span>Doppler JSON</span>
            </label>
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={importFormat === "env" ? "DATABASE_URL=postgres://localhost\STRIPE_SECRET_KEY=sk_test_…" : '{"DATABASE_URL":"postgres://localhost","STRIPE_SECRET_KEY":"sk_test_…"}'}
            rows={6}
            className="ms-input font-mono text-xs"
          />
          <button type="submit" disabled={pending || !importText.trim()} className="ms-btn">
            {pending ? "Importing…" : "Import"}
          </button>
        </form>
      </section>

      <section className="ms-card p-4 space-y-3">
        <h3 className="font-semibold">Env-injection tokens ({tokens.length})</h3>
        <p className="ms-mono text-xs text-[var(--text-fog)]">
          Use these tokens with the <code>ms-vault run</code> CLI shim to inject secrets into a subprocess environment.
        </p>
        {tokens.length > 0 && (
          <ul className="space-y-1 text-sm">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-t border-[var(--hairline)] py-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="ms-mono text-xs text-[var(--text-fog)]">
                    …{t.last4} · created {new Date(t.createdAt).toLocaleString()}
                    {t.lastUsedAt ? ` · last used ${new Date(t.lastUsedAt).toLocaleString()}` : ""}
                    {t.expiresAt ? ` · expires ${new Date(t.expiresAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <button type="button" onClick={() => revokeToken(t)} className="ms-btn-sm ms-btn-danger">
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={createToken} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block space-y-1 md:col-span-2">
              <span className="ms-mono-eyebrow">Token name</span>
              <input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="ci-deploy"
                className="ms-input"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="ms-mono-eyebrow">Expires in (days, blank = never)</span>
              <input
                value={tokenExpiry}
                onChange={(e) => setTokenExpiry(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                type="number"
                min={1}
                placeholder="30"
                className="ms-input"
              />
            </label>
          </div>
          <button type="submit" disabled={!tokenName.trim()} className="ms-btn">
            Mint token
          </button>
        </form>
        {newToken && (
          <div className="ms-card p-3 bg-[var(--color-gilt)]/5 border-[var(--color-gilt)]">
            <p className="ms-mono-eyebrow text-[var(--color-gilt-light)]">Copy this token now — it won't be shown again:</p>
            <pre className="ms-mono text-xs mt-1 break-all whitespace-pre-wrap">{newToken}</pre>
            <p className="ms-mono text-xs mt-2 text-[var(--text-fog)]">
              Usage: <code>ms-vault run --project {projectId} --token &lt;token&gt; -- npm start</code>
            </p>
          </div>
        )}
      </section>

      <section className="ms-card p-4">
        <h3 className="font-semibold mb-3">Audit log (last 100)</h3>
        {audit.length === 0 ? (
          <p className="ms-mono text-xs text-[var(--text-fog)]">No audit events yet.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {audit.map((a) => (
              <li key={a.id} className="border-t border-[var(--hairline)] py-1.5 font-mono">
                <span className="text-[var(--text-mist)]">{new Date(a.createdAt).toLocaleString()}</span>{" "}
                <span className="font-semibold">{a.action}</span>{" "}
                <span className="text-[var(--text-fog)]">by {a.actor}</span>
                {a.metadata && Object.keys(a.metadata).length > 0 && (
                  <span className="text-[var(--text-fog)]"> · {JSON.stringify(a.metadata)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(error || success) && (
        <div className={`ms-card p-3 text-sm ${error ? "ms-app-error" : "border-[var(--color-flood)] text-[var(--color-flood)]"}`}>
          {error ?? success}
        </div>
      )}
    </div>
  );
}
