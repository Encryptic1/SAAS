import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VaultDashboardShell } from "@/components/vault-dashboard-shell";
import { ProjectDetailManager } from "@/components/project-detail-manager";
import { getOwnerId } from "@/lib/owner";
import { getProject, listProjectSecrets, listProjectTokens, listAuditLog, listProjectReferences } from "@/lib/vault-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ProjectDetail({ id }: { id: string }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return notFound();
  const project = await getProject(id, ownerId);
  if (!project) return notFound();

  const [secrets, tokens, audit, references] = await Promise.all([
    listProjectSecrets(id),
    listProjectTokens(id),
    listAuditLog(id),
    listProjectReferences(id),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h1 className="ms-dash-h1">{project.name}</h1>
            <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
              {project.environment}
              {project.githubRepo ? ` · ${project.githubRepo}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/projects/${id}/references`}
              target="_blank"
              rel="noreferrer"
              className="ms-btn-sm"
              title="AI-agent reference endpoint — share with agents so they can see what secrets exist"
            >
              Agent reference URL ↗
            </a>
          </div>
        </div>
        {project.description && (
          <p className="text-sm text-[var(--text-mist)] mt-2">{project.description}</p>
        )}
      </header>

      {references.length > 0 && (
        <section className="ms-card p-4">
          <h3 className="font-semibold mb-2">AI-agent reference view ({references.length})</h3>
          <p className="text-xs text-[var(--text-fog)] mb-3">
            Secrets visible to AI agents (key + version only, no values):
          </p>
          <ul className="space-y-1 text-sm">
            {references.map((r) => (
              <li key={r.key} className="border-t border-[var(--hairline)] py-1.5 font-mono">
                <span className="font-semibold">{r.key}</span>{" "}
                <span className="text-[var(--text-fog)]">v{r.version}</span>
                {r.notes && <span className="text-[var(--text-mist)]"> · {r.notes}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ProjectDetailManager
        projectId={id}
        initialSecrets={secrets.map((s) => ({
          ...s,
          lastRotatedAt: s.lastRotatedAt ? s.lastRotatedAt.toISOString() : null,
        }))}
        initialTokens={tokens.map((t) => ({
          ...t,
          lastUsedAt: t.lastUsedAt ? t.lastUsedAt.toISOString() : null,
          expiresAt: t.expiresAt ? t.expiresAt.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
        }))}
        initialAudit={audit.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <VaultDashboardShell>
      <Suspense fallback={<div className="ms-mono text-sm">Loading…</div>}>
        <ProjectDetail id={id} />
      </Suspense>
    </VaultDashboardShell>
  );
}
