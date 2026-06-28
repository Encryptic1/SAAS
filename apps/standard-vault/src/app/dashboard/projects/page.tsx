import { Suspense } from "react";
import { VaultDashboardShell } from "@/components/vault-dashboard-shell";
import { CreateProjectForm } from "@/components/create-project-form";
import { getOwnerId } from "@/lib/owner";
import { listOwnerProjects } from "@/lib/vault-data";

export const dynamic = "force-dynamic";

async function ProjectsList() {
  const ownerId = await getOwnerId();
  const projects = ownerId ? await listOwnerProjects(ownerId) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ms-dash-h1">Projects</h1>
        <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
          Each project is an isolated secret namespace (one environment per project).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {projects.length === 0 ? (
            <div className="ms-card p-6 text-center">
              <p className="ms-mono text-sm text-[var(--text-fog)]">
                No projects yet. Create one to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="ms-card p-4 hover:border-[var(--color-gilt)]">
                  <a href={`/dashboard/projects/${p.id}`} className="block">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-lg">{p.name}</span>
                      <span className="ms-chip ms-chip-on">{p.environment}</span>
                    </div>
                    {p.githubRepo && (
                      <div className="ms-mono text-xs text-[var(--text-fog)] mt-1">repo: {p.githubRepo}</div>
                    )}
                    {p.description && (
                      <div className="text-sm text-[var(--text-mist)] mt-1">{p.description}</div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CreateProjectForm />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <VaultDashboardShell>
      <Suspense fallback={<div className="ms-mono text-sm">Loading…</div>}>
        <ProjectsList />
      </Suspense>
    </VaultDashboardShell>
  );
}
