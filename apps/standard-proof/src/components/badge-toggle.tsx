"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BadgeToggleProps {
  collectionId: string;
  showBadge: boolean;
  canToggle: boolean;
}

export function BadgeToggle({ collectionId, showBadge, canToggle }: BadgeToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (!canToggle) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collectionId, showBadge: !showBadge }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not update");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update badge setting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ms-app-card-inner">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-[var(--text-foam)]">Powered-by badge</p>
          <p className="text-sm ms-app-muted">
            {canToggle
              ? "Show or hide the Market Standard badge on embeds and public pages."
              : "Upgrade to a paid plan to remove the badge."}
          </p>
        </div>
        <button
          type="button"
          disabled={!canToggle || loading}
          onClick={handleToggle}
          className="ms-btn ms-btn-gilt shrink-0"
        >
          {loading ? "…" : showBadge ? "Badge on" : "Badge off"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm ms-app-error">{error}</p>}
    </div>
  );
}
