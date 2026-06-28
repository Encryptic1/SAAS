"use client";

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  source: string | null;
  recurrenceCount: number;
};

const SEV_COLOR: Record<string, string> = {
  sev1: "ms-status-failed",
  sev2: "ms-status-failed",
  sev3: "ms-status-running",
  sev4: "ms-status-neutral",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  investigating: "Investigating",
  resolved: "Resolved",
  archived: "Archived",
};

export function IncidentsList({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No postmortems yet. Start one from an incident in Standard Hook or Standard Status, or create one manually.</p>
      </div>
    );
  }
  return (
    <div className="ms-card divide-y">
      {incidents.map((i) => (
        <a key={i.id} href={`/dashboard/${i.id}`} className="block p-4 hover:ms-row-hover">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{i.title}</p>
              <p className="text-xs ms-app-muted mt-0.5">
                Started {new Date(i.startedAt).toLocaleDateString()}
                {i.resolvedAt && ` · resolved ${new Date(i.resolvedAt).toLocaleDateString()}`}
                {i.source && ` · from ${i.source}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {i.recurrenceCount > 0 && (
                <span className="ms-badge ms-badge-strong ms-status-running text-xs" title="Linked to similar incidents">
                  ↻ {i.recurrenceCount}
                </span>
              )}
              <span className={`ms-badge ms-badge-strong ${SEV_COLOR[i.severity] ?? "ms-status-neutral"} text-xs uppercase`}>
                {i.severity}
              </span>
              <span className="text-xs ms-app-muted">{STATUS_LABEL[i.status] ?? i.status}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
