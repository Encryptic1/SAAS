import { LensDashboardShell } from "@/components/lens-dashboard-shell";
import { QueryExplainer } from "@/components/query-explainer";
import { PageHeader } from "@market-standard/ui";

export const dynamic = "force-dynamic";

export default function ExplainPage() {
  return (
    <LensDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Lens"
          title="EXPLAIN a query"
          subtitle="Paste a SQL query to score it and visualize the plan."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Explain" }]}
        />
        <QueryExplainer />
      </div>
    </LensDashboardShell>
  );
}
