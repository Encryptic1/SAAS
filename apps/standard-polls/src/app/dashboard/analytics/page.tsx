import { Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable } from "@market-standard/ui";
import { loadPollsAnalytics, type PollRow } from "../../../lib/polls-data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { events, topPolls } = await loadPollsAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="ms-dash-page-title">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">Product events and top polls.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KPI events</CardTitle>
          <CardDescription>Tracked product events for Standard Polls</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-[var(--text-mist)]">No events recorded yet.</p>
          ) : (
            <DataTable<{ id: string; event: string; count: number }>
              data={events.map((e, i) => ({ id: String(i), event: e.event, count: e.count }))}
              getRowKey={(r) => r.id}
              columns={[
                { key: "event", header: "Event", render: (r) => r.event },
                { key: "count", header: "Count", render: (r) => r.count },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top polls</CardTitle>
          <CardDescription>Most recent polls by vote count</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<PollRow>
            data={topPolls}
            getRowKey={(r) => r.id}
            emptyMessage="No polls yet."
            columns={[
              { key: "question", header: "Question", render: (r) => r.question },
              { key: "votes", header: "Votes", render: (r) => r.voteCount ?? 0 },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
