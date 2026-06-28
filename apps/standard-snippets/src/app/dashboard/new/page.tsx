import { SnippetsDashboardShell } from "@/components/snippets-dashboard-shell";
import { CreateSnippetForm } from "@/components/create-snippet-form";

export const dynamic = "force-dynamic";

export default function NewSnippetPage() {
  return (
    <SnippetsDashboardShell>
      <div className="space-y-6">
        <header>
          <h1 className="ms-dash-h1">New snippet</h1>
          <p className="ms-mono text-sm text-[var(--text-fog)] mt-1">
            Create a new snippet. You can edit + version it after creation.
          </p>
        </header>
        <div className="max-w-2xl">
          <CreateSnippetForm />
        </div>
      </div>
    </SnippetsDashboardShell>
  );
}
