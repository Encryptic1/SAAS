"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  environment: string;
  githubRepo: string | null;
  description: string | null;
}

/** Form to create a new vault project. Server-component safe (no function props required). */
export function CreateProjectForm({ onCreated }: { onCreated?: (project: Project) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [githubRepo, setGithubRepo] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          environment: environment.trim() || "production",
          githubRepo: githubRepo.trim() || null,
          description: description.trim() || null,
        }),
      });
      const data = (await res.json()) as { project?: Project; error?: string };
      if (!res.ok || !data.project) {
        setError(data.error ?? "Failed to create project");
        return;
      }
      setName("");
      setGithubRepo("");
      setDescription("");
      setEnvironment("production");
      onCreated?.(data.project);
      router.refresh();
    } catch {
      setError("Could not create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ms-card p-4 space-y-3">
      <h3 className="font-semibold">New project</h3>
      <Field label="Name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-app production"
          className="ms-input"
          required
        />
      </Field>
      <Field label="Environment">
        <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className="ms-input">
          <option value="production">production</option>
          <option value="staging">staging</option>
          <option value="development">development</option>
          <option value="preview">preview</option>
        </select>
      </Field>
      <Field label="GitHub repo (optional — for Actions sync)">
        <input
          value={githubRepo}
          onChange={(e) => setGithubRepo(e.target.value)}
          placeholder="owner/repo"
          className="ms-input"
        />
      </Field>
      <Field label="Description (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project for?"
          rows={2}
          className="ms-input"
        />
      </Field>
      {error && <p className="ms-app-error text-xs">{error}</p>}
      <button type="submit" disabled={loading || !name.trim()} className="ms-btn">
        {loading ? "Creating…" : "Create project"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="ms-mono-eyebrow">{label}</span>
      {children}
    </label>
  );
}
