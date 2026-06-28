import { Suspense } from "react";
import { PageHeader } from "@market-standard/ui";
import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { CreateSnippetForm } from "@/components/create-snippet-form";

export const dynamic = "force-dynamic";

export default function NewSnippetPage() {
  return (
    <SnippetsDashboardShell>
      <div className="space-y-8 max-w-2xl">
        <PageHeader
          eyebrow="Standard Snippets"
          title="New snippet"
          subtitle="Create a new snippet. You can edit + version it after creation."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "New" }]}
        />
        <Suspense fallback={<div className="ms-card p-4 text-sm ms-app-muted">Loading form…</div>}>
          <CreateSnippetForm />
        </Suspense>
      </div>
    </SnippetsDashboardShell>
  );
}
