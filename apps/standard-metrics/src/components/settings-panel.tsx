"use client";

import { useState } from "react";

interface SettingsPanelProps {
  connected: boolean;
  stripeAccountId: string | null;
}

export function SettingsPanel({ connected, stripeAccountId }: SettingsPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      window.location.href = "/api/stripe/connect";
    } catch {
      setError("Could not initiate Stripe Connect.");
      setBusy(false);
    }
  }

  if (connected) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Status:{" "}
          <span className="ms-app-badge ms-app-badge-ok">Connected</span>
        </p>
        <p className="text-sm text-[var(--text-mist)]">
          Stripe account: <code className="ms-app-pre">{stripeAccountId}</code>
        </p>
        <p className="text-xs text-[var(--text-mist)]">
          To revoke access, visit the Stripe dashboard → Connected applications.
        </p>
        <button type="button" onClick={connect} disabled={busy} className="ms-btn ms-btn-ghost">
          Reconnect
        </button>
        {error && <p className="text-sm text-[var(--color-breach)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-mist)]">
        Connect Stripe to start syncing MRR, ARR, churn, and LTV snapshots daily.
      </p>
      <button type="button" onClick={connect} disabled={busy} className="ms-btn ms-btn-primary">
        {busy ? "Redirecting…" : "Connect Stripe"}
      </button>
      {error && <p className="text-sm text-[var(--color-breach)]">{error}</p>}
    </div>
  );
}
