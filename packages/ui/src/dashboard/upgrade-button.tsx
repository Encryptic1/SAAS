"use client";

import { useState } from "react";
import { cn } from "../lib/utils";

export interface UpgradeButtonProps {
  tier: "starter" | "growth" | "business";
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function UpgradeButton({
  tier,
  children = "Upgrade plan",
  className,
  disabled,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={cn("ms-btn ms-btn-primary", className)}
      >
        {loading ? "Redirecting…" : children}
      </button>
      {error && <span className="text-xs ms-app-error">{error}</span>}
    </div>
  );
}
