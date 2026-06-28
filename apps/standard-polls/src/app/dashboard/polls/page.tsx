import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, EmptyState } from "@market-standard/ui";
import { loadPollsList, type PollRow } from "../../../lib/polls-data";

export const dynamic = "force-dynamic";

export default async function PollsListPage() {
  const rows = await loadPollsList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Polls</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Polls created via Slack <code className="ms-app-pre inline px-1">/poll</code> or local simulator.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No polls yet"
          description="Install the Slack app or use the local dev simulator to create your first poll."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent polls</CardTitle>
            <CardDescription>{rows.length} poll(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable<PollRow>
              data={rows}
              getRowKey={(r) => r.id}
              columns={[
                { key: "question", header: "Question", render: (r) => r.question },
                {
                  key: "options",
                  header: "Options",
                  render: (r) => r.options.join(" · "),
                },
                { key: "votes", header: "Votes", render: (r) => r.voteCount ?? 0 },
                {
                  key: "created",
                  header: "Created",
                  render: (r) => new Date(r.createdAt).toLocaleDateString(),
                },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
