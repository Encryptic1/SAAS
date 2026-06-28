import type { SlowQuery } from "@/lib/lens-data";

export function SlowQueriesList({ slowQueries }: { slowQueries: SlowQuery[] }) {
  if (slowQueries.length === 0) {
    return (
      <div className="ms-card p-6 text-center">
        <p className="text-sm ms-app-muted">No slow queries captured yet. Set a threshold and POST overruns to /api/slow.</p>
      </div>
    );
  }

  return (
    <div className="ms-card p-0 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="ms-app-muted border-b border-[var(--hairline)]">
          <tr>
            <th className="text-left p-2">Captured</th>
            <th className="text-left p-2">Source</th>
            <th className="text-left p-2">Database</th>
            <th className="text-right p-2">Duration</th>
            <th className="text-right p-2">Threshold</th>
            <th className="text-left p-2">SQL</th>
          </tr>
        </thead>
        <tbody>
          {slowQueries.map((q) => (
            <tr key={q.id} className="border-b border-[var(--hairline)] last:border-0">
              <td className="p-2 whitespace-nowrap">{new Date(q.capturedAt).toLocaleString()}</td>
              <td className="p-2"><span className="ms-badge ms-badge-neutral text-[10px]">{q.source}</span></td>
              <td className="p-2">{q.databaseLabel}</td>
              <td className="p-2 text-right font-mono"><span className="ms-badge ms-badge-error text-[10px]">{q.durationMs.toFixed(1)}ms</span></td>
              <td className="p-2 text-right font-mono ms-app-muted">{q.thresholdMs.toFixed(1)}ms</td>
              <td className="p-2 font-mono max-w-md truncate" title={q.sqlText}>{q.sqlText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
