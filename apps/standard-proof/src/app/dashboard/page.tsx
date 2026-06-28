import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@market-standard/ui";
import { getDashboardStats, listOwnerCollections } from "@/lib/proof-data";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const stats = await getDashboardStats();
  const collections = await listOwnerCollections();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

  return (
    <>
      <h1 className="ms-app-title">Overview</h1>
      <p className="mt-2 ms-app-muted">Your testimonial collections at a glance.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Collections" value={String(stats.collections)} />
        <StatCard label="Approved" value={String(stats.approved)} />
        <StatCard label="Pending review" value={String(stats.pending)} />
        <StatCard label="Featured" value={String(stats.featured)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent collections</CardTitle>
            <CardDescription>
              <Link href="/dashboard/collections" className="ms-app-link">
                Manage all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {collections.length === 0 ? (
              <p className="text-sm ms-app-muted">No collections yet.</p>
            ) : (
              collections.slice(0, 5).map((c) => (
                <div key={c.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{c.name}</p>
                  <p className="text-sm ms-app-muted">/{c.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/collections/${c.id}`}
                      className="ms-app-link text-sm no-underline hover:underline"
                    >
                      Inbox
                    </Link>
                    <Link href={`/c/${c.slug}`} className="ms-app-link text-sm no-underline hover:underline">
                      Public page
                    </Link>
                    <Link href={`/submit/${c.slug}`} className="ms-app-link text-sm no-underline hover:underline">
                      Submit form
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embed snippet</CardTitle>
            <CardDescription>Add to any website with a script tag.</CardDescription>
          </CardHeader>
          <CardContent>
            {collections[0] ? (
              <>
                <pre className="ms-app-pre">{`<script src="${appUrl}/api/embed/${collections[0].slug}.js" async></script>
<div data-proof-collection="${collections[0].slug}"></div>`}</pre>
                <p className="mt-3 text-sm ms-app-muted">
                  Using &ldquo;{collections[0].name}&rdquo; —{" "}
                  <Link href={`/embed/${collections[0].slug}`} className="ms-app-link">
                    preview embed
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm ms-app-muted">Create a collection to get your embed code.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
