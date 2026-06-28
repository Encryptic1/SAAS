import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@market-standard/ui";
import { getDashboardStats, listOwnerInboxes } from "@/lib/hook-data";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const inboxes = await listOwnerInboxes();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";

  return (
    <>
      <h1 className="ms-app-title">Overview</h1>
      <p className="mt-2 ms-app-muted">Your webhook inboxes at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Inboxes" value={String(stats.inboxes)} />
        <StatCard label="Events captured" value={String(stats.events)} />
        <StatCard
          label="Latest event"
          value={stats.latestEventAt ? new Date(stats.latestEventAt).toLocaleString() : "—"}
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent inboxes</CardTitle>
            <CardDescription>
              <Link href="/dashboard/inboxes" className="ms-app-link">
                Manage all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboxes.length === 0 ? (
              <p className="text-sm ms-app-muted">No inboxes yet.</p>
            ) : (
              inboxes.slice(0, 5).map((inbox) => (
                <div key={inbox.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{inbox.name}</p>
                  <p className="text-sm ms-app-muted">/{inbox.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/inboxes/${inbox.id}`}
                      className="ms-app-link text-sm no-underline hover:underline"
                    >
                      Events
                    </Link>
                    <span className="text-sm ms-app-muted font-mono">
                      {appUrl}/api/capture/{inbox.slug}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capture URL</CardTitle>
            <CardDescription>Point any webhook provider at this endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            {inboxes[0] ? (
              <pre className="ms-app-pre">{`${appUrl}/api/capture/${inboxes[0].slug}`}</pre>
            ) : (
              <p className="text-sm ms-app-muted">Create an inbox to get your capture URL.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
