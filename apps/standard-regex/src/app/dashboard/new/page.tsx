import { RegexDashboardShell } from "@/components/regex-dashboard-shell";
import { RegexEditor } from "@/components/regex-editor";

export const dynamic = "force-dynamic";

export default function NewPatternPage() {
  return (
    <RegexDashboardShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">New pattern</h1>
          <p className="text-sm ms-app-muted">Build, test, and save a regex pattern.</p>
        </div>
        <RegexEditor
          initialPattern="\\d{4}-\\d{2}-\\d{2}"
          initialFlags="g"
          initialTestCases={[
            { input: "Shipped on 2026-06-27", expectedMatches: 1 },
            { input: "no dates here", expectedMatches: 0 },
          ]}
        />
      </div>
    </RegexDashboardShell>
  );
}
