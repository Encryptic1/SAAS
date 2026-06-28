"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Query } from "@/lib/lens-data";

export function QueriesList({ queries }: { queries: Query[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function togglePin(q: Query) {
    setBusy(q.id);
    try {
      await fetch(`/api/queries/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !q.isPinned }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(q: Query) {
    if (!confirm(`Delete "${q.name}"?`)) return;
    setBusy(q.id);
    try {
      await fetch(`/api/queries/${q.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (queries.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No saved queries yet. Save one above to start scoring.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {queries.map((q) => (
        <div key={q.id} className="ms-card p-3 flex items-start gap-3">
          <button
            type="button"
            onClick={() => togglePin(q)}
            disabled={busy === q.id}
            className="ms-btn ms-btn-ghost px-2 py-1 text-xs"
            aria-label={q.isPinned ? "Unpin" : "Pin"}
            title={q.isPinned ? "Unpin" : "Pin to top"}
          >
            {q.isPinned ? "★" : "☆"}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{q.name}</span>
              <span className="ms-badge ms-badge-neutral text-[10px]">{q.databaseLabel}</span>
              {q.avgMs !== null && q.avgMs !== undefined && (
                <span className="ms-badge ms-badge-info text-[10px]">avg {Number(q.avgMs).toFixed(1)}ms</span>
              )}
            </div>
            <pre className="mt-1 text-[11px] ms-app-muted font-mono whitespace-pre-wrap break-all line-clamp-2">
              {q.sqlText}
            </pre>
            {q.tags && q.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {q.tags.map((t) => (
                  <span key={t} className="ms-badge ms-badge-neutral text-[10px]">#{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <a
              href={`/dashboard/explain?sql=${encodeURIComponent(q.sqlText)}`}
              className="ms-btn ms-btn-ghost px-2 py-1 text-xs no-underline"
            >
              Explain
            </a>
            <button
              type="button"
              onClick={() => handleDelete(q)}
              disabled={busy === q.id}
              className="ms-btn ms-btn-ghost px-2 py-1 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
