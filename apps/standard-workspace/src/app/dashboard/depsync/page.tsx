import { WorkspaceDashboardShell } from "@/components/workspace-dashboard-shell";
import { DepsyncViewer } from "@/components/depsync-viewer";
import { Badge, KpiCard, PageHeader } from "@market-standard/ui";
import { computeDepsyncReport } from "@/lib/depsync";

export const dynamic = "force-dynamic";

export default async function DepsyncPage() {
  const report = await computeDepsyncReport();
  const appCount = report.packages[0]?.versions.length ?? 0;
  const packageCount = report.packages.length;
  const divergentCount = report.divergent.length;

  return (
    <WorkspaceDashboardShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Standard Workspace"
          title="Dependency Parity"
          subtitle="@market-standard/* versions across all apps."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Depsync" }]}
          actions={
            <Badge variant={divergentCount === 0 ? "success" : "warning"} dot>
              {divergentCount === 0 ? "all in parity" : `${divergentCount} divergent`}
            </Badge>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Apps scanned" value={String(appCount)} hint="apps/* with package.json" spark={[appCount]} sparkBinary />
          <KpiCard label="Shared packages" value={String(packageCount)} hint="@market-standard/* deps" spark={[packageCount]} sparkBinary />
          <KpiCard label="Divergent" value={String(divergentCount)} hint="Apps behind on a package" spark={report.divergent.map(() => 0)} sparkBinary />
        </div>

        <DepsyncViewer report={report} />
      </div>
    </WorkspaceDashboardShell>
  );
}
