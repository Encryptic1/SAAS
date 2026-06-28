import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@market-standard/ui";
import { CreateInboxForm } from "@/components/create-inbox-form";
import { listOwnerInboxes } from "@/lib/hook-data";

export const dynamic = "force-dynamic";

export default async function InboxesPage() {
  const inboxes = await listOwnerInboxes();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";

  return (
    <>
      <h1 className="ms-app-title">Inboxes</h1>
      <p className="mt-2 ms-app-muted">Create webhook capture endpoints and inspect events.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New inbox</CardTitle>
            <CardDescription>Each inbox gets a unique public capture URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInboxForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your inboxes</CardTitle>
            <CardDescription>{inboxes.length} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboxes.length === 0 ? (
              <EmptyState
                title="No inboxes yet"
                description="Create an inbox to start capturing webhooks."
              />
            ) : (
              inboxes.map((inbox) => (
                <div key={inbox.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{inbox.name}</p>
                  <p className="text-sm ms-app-muted font-mono break-all">
                    {appUrl}/api/capture/{inbox.slug}
                  </p>
                  <div className="mt-2">
                    <Link
                      href={`/dashboard/inboxes/${inbox.id}`}
                      className="ms-app-link text-sm no-underline hover:underline"
                    >
                      View events →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
