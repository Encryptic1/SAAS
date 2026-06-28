import Link from "next/link";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  KpiCard,
  PageHeader,
  StatCard,
} from "@market-standard/ui";
import { getDashboardStats, listOwnerInboxes } from "@/lib/hook-data";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const inboxes = await listOwnerInboxes();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Standard Hook"
        title="Overview"
        subtitle="Your webhook inboxes at a glance."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
        actions={
          <Badge variant={stats.inboxes > 0 ? "success" : "neutral"} dot>
            {stats.inboxes} inbox{stats.inboxes === 1 ? "" : "es"}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Inboxes"
          value={String(stats.inboxes)}
          hint="Capture URLs provisioned"
          spark={[1, 1, 1, 1, 1, 1, 1].slice(0, Math.max(stats.inboxes, 1))}
          sparkBinary
        />
        <KpiCard
          label="Events captured"
          value={String(stats.events)}
          hint="All-time inbound webhooks"
        />
        <KpiCard
          label="Latest event"
          value={stats.latestEventAt ? new Date(stats.latestEventAt).toLocaleTimeString() : "—"}
          hint={stats.latestEventAt ? new Date(stats.latestEventAt).toLocaleDateString() : "No events yet"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              <EmptyState
                preset="inbox"
                title="No inboxes yet"
                description="Create your first inbox to get a capture URL."
                action={
                  <Link href="/dashboard/inboxes" className="ms-btn ms-btn-primary no-underline">
                    Create inbox
                  </Link>
                }
              />
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
    </div>
  );
}
