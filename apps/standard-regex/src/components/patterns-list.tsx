"use client";

type Pattern = {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string | null;
  tags: string[] | null;
  isPublic: boolean;
  updatedAt: string;
};

export function PatternsList({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No patterns yet. Build one in the editor.</p>
      </div>
    );
  }
  return (
    <div className="ms-card divide-y">
      {patterns.map((p) => (
        <a key={p.id} href={`/dashboard/${p.id}`} className="block p-4 hover:ms-row-hover">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{p.name}</p>
              <p className="font-mono text-xs ms-app-muted truncate">
                /{p.pattern}/{p.flags}
              </p>
              {p.description && <p className="text-xs ms-app-muted mt-1 truncate">{p.description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {p.isPublic && <span className="ms-badge ms-badge-strong ms-status-success text-xs">public</span>}
              <span className="text-xs ms-app-muted">{new Date(p.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          {p.tags && p.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((t) => (
                <span key={t} className="ms-badge ms-badge-neutral text-xs">#{t}</span>
              ))}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
