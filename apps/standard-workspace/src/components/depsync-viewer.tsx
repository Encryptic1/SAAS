import { Badge } from "@market-standard/ui";

export type DepsyncEntry = {
  app: string;
  packages: Array<{ name: string; version: string }>;
};

export type DepsyncReport = {
  packages: Array<{ name: string; versions: Array<{ app: string; version: string }> }>;
  divergent: Array<{ name: string; uniqueVersions: string[]; apps: string[] }>;
  generatedAt: string;
};

export function DepsyncViewer({ report }: { report: DepsyncReport }) {
  const divergentCount = report.divergent.length;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={divergentCount === 0 ? "success" : "warning"} dot>
          {divergentCount === 0 ? "all in parity" : `${divergentCount} divergent`}
        </Badge>
        <span className="ms-app-muted text-xs">
          @market-standard/* versions across {report.packages[0]?.versions.length ?? 0} apps
        </span>
      </div>
      {divergentCount === 0 ? (
        <div className="ms-card p-6 text-center">
          <p className="text-sm">All apps are on the same versions of every shared package.</p>
        </div>
      ) : (
        <div className="ms-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase opacity-60">
              <tr>
                <th className="p-3">Package</th>
                <th className="p-3">Versions</th>
                <th className="p-3">Apps affected</th>
              </tr>
            </thead>
            <tbody>
              {report.divergent.map((d) => (
                <tr key={d.name} className="border-t border-[var(--hairline)]">
                  <td className="p-3 font-mono text-xs">{d.name}</td>
                  <td className="p-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {d.uniqueVersions.map((v) => (
                        <Badge key={v} variant="neutral">{v}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-xs opacity-70">{d.apps.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="ms-app-muted text-xs">
        Generated {new Date(report.generatedAt).toLocaleString()}. Run <code className="ms-code">pnpm depsync</code> locally to refresh.
      </p>
    </div>
  );
}
