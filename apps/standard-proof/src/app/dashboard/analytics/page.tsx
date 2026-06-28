import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { kpiEvents } from "@market-standard/db/schema/shared";
import { eq } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

const PRODUCT = "standard-proof";

export default async function AnalyticsPage() {
  let events: Array<{ event: string; createdAt: Date | string }> = [];

  if (isLocalGatewayMode()) {
    const rows = await fetchGateway<Array<{ event: string; createdAt: string }>>(
      `/proof/kpi-events?product=${PRODUCT}`,
    );
    events = rows;
  } else {
    const db = await getDbAsync();
    events = await db
      .select({ event: kpiEvents.event, createdAt: kpiEvents.createdAt })
      .from(kpiEvents)
      .where(eq(kpiEvents.product, PRODUCT));
  }

  const counts = events.reduce<Record<string, number>>((acc, row) => {
    acc[row.event] = (acc[row.event] ?? 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <h1 className="ms-app-title">Analytics</h1>
      <p className="mt-2 ms-app-muted">Event counts from kpi_events for Standard Proof.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No events yet</CardTitle>
              <CardDescription>KPI events will appear as users interact with your collections.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          sorted.map(([event, count]) => (
            <Card key={event}>
              <CardHeader>
                <CardDescription>{event}</CardDescription>
                <CardTitle className="text-3xl">{count}</CardTitle>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {events.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
            <CardDescription>Last {Math.min(events.length, 20)} recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[...events]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )
                .slice(0, 20)
                .map((row, i) => (
                  <li key={`${row.event}-${i}`} className="flex justify-between gap-4 ms-app-muted">
                    <span>{row.event}</span>
                    <span>{new Date(row.createdAt).toLocaleString()}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
