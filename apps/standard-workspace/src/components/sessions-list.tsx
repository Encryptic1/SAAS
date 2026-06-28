import { Badge, StatusBadge } from "@market-standard/ui";
import type { Session } from "@/lib/workspace-data";

export function SessionsList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="ms-app-muted text-sm">No dev sessions yet.</p>
        <p className="ms-app-muted text-xs mt-1">
          Start one with <code className="ms-code">POST /api/sessions</code> or the form above.
        </p>
      </div>
    );
  }
  return (
    <div className="ms-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase opacity-60">
          <tr>
            <th className="p-3">Label</th>
            <th className="p-3">Apps</th>
            <th className="p-3">Status</th>
            <th className="p-3">Started</th>
            <th className="p-3">Logs</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t border-[var(--hairline)]">
              <td className="p-3 font-medium">{s.label}</td>
              <td className="p-3 opacity-70 text-xs">{s.apps || "—"}</td>
              <td className="p-3">
                <SessionStatusBadge status={s.status} />
              </td>
              <td className="p-3 opacity-70 text-xs">{new Date(s.startedAt).toLocaleString()}</td>
              <td className="p-3">
                <a className="ms-app-link text-xs" href={`/dashboard/sessions#${s.id}`}>
                  tail →
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const variant =
    status === "running" ? "success" : status === "stopped" ? "neutral" : status === "crashed" ? "danger" : "warning";
  return <Badge variant={variant as "success" | "neutral" | "danger" | "warning"} dot>{status}</Badge>;
}

export { StatusBadge };
