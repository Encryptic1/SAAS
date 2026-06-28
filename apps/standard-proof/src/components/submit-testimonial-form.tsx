"use client";

import { useState } from "react";

interface SubmitTestimonialFormProps {
  slug: string;
  collectionName: string;
}

export function SubmitTestimonialForm({ slug, collectionName }: SubmitTestimonialFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, authorName, authorTitle, content, rating }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit testimonial");
        return;
      }
      setAuthorName("");
      setAuthorTitle("");
      setContent("");
      setRating(5);
      setMessage("Thanks! Your testimonial was submitted for review.");
    } catch {
      setError("Could not submit testimonial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm ms-app-muted">Share your experience with {collectionName}.</p>
      <div>
        <label htmlFor="authorName" className="ms-app-label">
          Your name
        </label>
        <input
          id="authorName"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="ms-app-input"
          required
        />
      </div>
      <div>
        <label htmlFor="authorTitle" className="ms-app-label">
          Title / company (optional)
        </label>
        <input
          id="authorTitle"
          value={authorTitle}
          onChange={(e) => setAuthorTitle(e.target.value)}
          className="ms-app-input"
        />
      </div>
      <div>
        <label htmlFor="content" className="ms-app-label">
          Testimonial
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="ms-app-textarea"
          rows={4}
          required
        />
      </div>
      <div>
        <label htmlFor="rating" className="ms-app-label">
          Rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="ms-app-input"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="ms-btn ms-btn-primary">
        {loading ? "Submitting…" : "Submit testimonial"}
      </button>
      {message && <p className="text-sm ms-app-success">{message}</p>}
      {error && <p className="text-sm ms-app-error">{error}</p>}
    </form>
  );
}
