import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@market-standard/ui";
import { CreateCollectionForm } from "@/components/create-collection-form";
import { listOwnerCollections } from "@/lib/proof-data";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await listOwnerCollections();

  return (
    <>
      <h1 className="ms-app-title">Collections</h1>
      <p className="mt-2 ms-app-muted">Create and manage testimonial walls.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New collection</CardTitle>
            <CardDescription>Each collection has its own public page and embed.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCollectionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your collections</CardTitle>
            <CardDescription>{collections.length} total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {collections.length === 0 ? (
              <EmptyState
                title="No collections yet"
                description="Create your first wall of love to start collecting testimonials."
              />
            ) : (
              collections.map((c) => (
                <div key={c.id} className="ms-app-card-inner">
                  <p className="font-medium text-[var(--text-foam)]">{c.name}</p>
                  <p className="text-sm ms-app-muted">/{c.slug} · {c.plan} plan</p>
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
      </div>
    </>
  );
}
