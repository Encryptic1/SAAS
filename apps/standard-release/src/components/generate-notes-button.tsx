"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface GenerateNotesButtonProps {
  repoId: string;
}

export function GenerateNotesButton({ repoId }: GenerateNotesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos/${repoId}/generate`, { method: "POST" });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      router.refresh();
      if (data.id) router.push(`/dashboard/notes/${data.id}`);
    } catch {
      setError("Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleGenerate} disabled={loading} className="ms-btn ms-btn-primary text-sm">
        {loading ? "Generating…" : "Generate release notes"}
      </button>
      {error && <p className="mt-1 text-xs ms-app-error">{error}</p>}
    </div>
  );
}
