import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import { ReplayEventButton } from "@/components/replay-event-button";
import { getOwnerInbox } from "@/lib/hook-data";

export const dynamic = "force-dynamic";

interface InboxEventsPageProps {
  params: Promise<{ id: string }>;
}

export default async function InboxEventsPage({ params }: InboxEventsPageProps) {
  const { id } = await params;
  const data = await getOwnerInbox(id);
  if (!data) notFound();

  const { inbox, events } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";
  const postmortemUrl = process.env.NEXT_PUBLIC_POSTMORTEM_URL ?? "http://localhost:3011";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ms-app-title">{inbox.name}</h1>
          <p className="mt-2 ms-app-muted font-mono text-sm break-all">
            {appUrl}/api/capture/{inbox.slug}
          </p>
        </div>
        <Link href="/dashboard/inboxes" className="ms-app-link text-sm no-underline hover:underline">
          ← All inboxes
        </Link>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>{events.length} captured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {events.length === 0 ? (
            <p className="text-sm ms-app-muted">No events yet. Send a request to the capture URL.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="ms-app-card-inner space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm text-[var(--color-flood)]">{event.method}</p>
                  <p className="text-xs ms-app-muted">
                    {event.receivedAt ? new Date(event.receivedAt).toLocaleString() : ""}
                  </p>
                </div>

                {event.headers && Object.keys(event.headers).length > 0 && (
                  <div>
                    <p className="ms-app-label">Headers</p>
                    <pre className="ms-app-pre mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(event.headers, null, 2)}
                    </pre>
                  </div>
                )}

                {event.queryParams && Object.keys(event.queryParams).length > 0 && (
                  <div>
                    <p className="ms-app-label">Query params</p>
                    <pre className="ms-app-pre mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(event.queryParams, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="ms-app-label">Body</p>
                  <pre className="ms-app-pre mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                    {event.body ?? "(empty)"}
                  </pre>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--hairline)] pt-3">
                  <ReplayEventButton eventId={event.id} />
                  <a
                    href={`${postmortemUrl}/dashboard/new?source=hook&event_id=${event.id}&inbox_slug=${inbox.slug}`}
                    className="ms-btn ms-btn-secondary no-underline text-xs"
                    title="Start a blameless postmortem from this webhook event"
                  >
                    Create postmortem →
                  </a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
