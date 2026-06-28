import { Suspense } from "react";
import { VaultDashboardShell } from "@/components/vault-dashboard-shell";
import { CreateProjectForm } from "@/components/create-project-form";
import { getOwnerId } from "@/lib/owner";
import { listOwnerProjects } from "@/lib/vault-data";

export const dynamic = "force-dynamic";

async function OverviewContent() {
  const ownerId = await getOwnerId();
  const projects = ownerId ? await listOwnerProjects(ownerId) : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="ms-dash-h1">Vault</h1>
        <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
          Encrypted secrets with env-injection, .env/Doppler import, and AI-agent reference mode.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Environments" value={new Set(projects.map((p) => p.environment)).size} />
        <Stat label="With GitHub repo" value={projects.filter((p) => p.githubRepo).length} />
        <Stat label="Production" value={projects.filter((p) => p.environment === "production").length} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ms-card p-4">
          <h3 className="font-semibold mb-3">Your projects</h3>
          {projects.length === 0 ? (
            <p className="ms-mono text-xs text-[var(--text-fog)]">
              No projects yet. Create one to start managing secrets.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="border-t border-[var(--hairline)] py-2">
                  <a href={`/dashboard/projects/${p.id}`} className="block">
                    <div className="font-medium hover:text-[var(--color-gilt-light)]">{p.name}</div>
                    <div className="ms-mono text-xs text-[var(--text-fog)]">
                      {p.environment}
                      {p.githubRepo ? ` · ${p.githubRepo}` : ""}
                      {p.description ? ` · ${p.description}` : ""}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <CreateProjectForm />
      </section>

      <section className="ms-card p-4">
        <h3 className="font-semibold mb-2">AI-agent reference mode</h3>
        <p className="text-sm text-[var(--text-mist)] mb-3">
          Toggle <code>agentReference</code> on any secret to let AI agents discover it exists
          (key + version) without ever seeing the value. Agents call:
        </p>
        <pre className="ms-mono text-xs ms-card p-3 overflow-x-auto">
{`GET /api/projects/{id}/references
→ { references: [{ key: "DATABASE_URL", version: 3, notes: "primary DB" }] }`}
        </pre>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="ms-card p-3">
      <div className="ms-mono-eyebrow">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function VaultOverviewPage() {
  return (
    <VaultDashboardShell>
      <Suspense fallback={<div className="ms-mono text-sm">Loading…</div>}>
        <OverviewContent />
      </Suspense>
    </VaultDashboardShell>
  );
}
