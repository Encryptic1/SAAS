import { LensDashboardShell } from "@/components/lens-dashboard-shell";
import { CreateQueryForm } from "@/components/create-query-form";
import { QueriesList } from "@/components/queries-list";
import { KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listQueries, listSlowQueries } from "@/lib/lens-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <LensDashboardShell><div>Sign in</div></LensDashboardShell>;
  const [queries, slow] = await Promise.all([
    listQueries(ownerId),
    listSlowQueries(ownerId, 5),
  ]);

  const pinnedCount = queries.filter((q) => q.isPinned).length;
  const slowCount = slow.length;

  return (
    <LensDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Lens"
          title="Query library"
          subtitle={`${queries.length} saved query(s).`}
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Library" }]}
          actions={
            <a href="/dashboard/explain" className="ms-btn ms-btn-primary no-underline">
              Explain a query
            </a>
          }
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Saved queries" value={String(queries.length)} hint="In your library" />
          <KpiCard label="Pinned" value={String(pinnedCount)} hint="Hot queries" />
          <KpiCard label="Recent slow" value={String(slowCount)} hint="Last 5 captures" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold ms-app-muted uppercase tracking-wide">Save a query</h2>
            <CreateQueryForm />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold ms-app-muted uppercase tracking-wide">Library</h2>
              <a href="/dashboard/slow" className="text-xs ms-app-link no-underline">View slow queries →</a>
            </div>
            <QueriesList queries={queries} />
          </div>
        </div>
      </div>
    </LensDashboardShell>
  );
}
