"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface TestimonialActionsProps {
  testimonialId: string;
  isApproved: boolean;
  isFeatured: boolean;
}

export function TestimonialActions({ testimonialId, isApproved, isFeatured }: TestimonialActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function patch(body: { isApproved?: boolean; isFeatured?: boolean }) {
    setLoading(Object.keys(body)[0] ?? "patch");
    try {
      await fetch(`/api/testimonials/${testimonialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!isApproved && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => patch({ isApproved: true })}
          className="ms-btn ms-btn-primary text-xs"
        >
          {loading === "isApproved" ? "…" : "Approve"}
        </button>
      )}
      {isApproved && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => patch({ isApproved: false })}
          className="ms-btn text-xs"
        >
          {loading === "isApproved" ? "…" : "Reject"}
        </button>
      )}
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => patch({ isFeatured: !isFeatured })}
        className="ms-btn ms-btn-gilt text-xs"
      >
        {loading === "isFeatured" ? "…" : isFeatured ? "Unfeature" : "Feature"}
      </button>
    </div>
  );
}
