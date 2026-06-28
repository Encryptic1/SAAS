import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@market-standard/ui";
import { TestimonialActions } from "@/components/testimonial-actions";
import { getOwnerCollection } from "@/lib/proof-data";

export const dynamic = "force-dynamic";

interface CollectionInboxPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionInboxPage({ params }: CollectionInboxPageProps) {
  const { id } = await params;
  const data = await getOwnerCollection(id);
  if (!data) notFound();

  const { collection, testimonials: items } = data;
  const pending = items.filter((t) => !t.isApproved);
  const approved = items.filter((t) => t.isApproved);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ms-app-title">{collection.name}</h1>
          <p className="mt-2 ms-app-muted">
            Testimonial inbox · /{collection.slug}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href={`/c/${collection.slug}`} className="ms-app-link no-underline hover:underline">
            Public page
          </Link>
          <Link href={`/submit/${collection.slug}`} className="ms-app-link no-underline hover:underline">
            Submit form
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending review</CardTitle>
            <CardDescription>{pending.length} awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pending.length === 0 ? (
              <p className="text-sm ms-app-muted">No pending testimonials.</p>
            ) : (
              pending.map((t) => (
                <div key={t.id} className="ms-app-card-inner space-y-3">
                  <p className="text-[var(--text-foam)]">&ldquo;{t.content}&rdquo;</p>
                  <p className="text-sm ms-app-muted">
                    — {t.authorName}
                    {t.authorTitle ? `, ${t.authorTitle}` : ""}
                    {t.rating ? ` · ${"★".repeat(t.rating)}` : ""}
                  </p>
                  <TestimonialActions
                    testimonialId={t.id}
                    isApproved={t.isApproved}
                    isFeatured={t.isFeatured}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved</CardTitle>
            <CardDescription>{approved.length} live on public pages and embeds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approved.length === 0 ? (
              <p className="text-sm ms-app-muted">No approved testimonials yet.</p>
            ) : (
              approved.map((t) => (
                <div key={t.id} className="ms-app-card-inner space-y-3">
                  <p className="text-[var(--text-foam)]">
                    {t.isFeatured && <span className="mr-2 text-[var(--color-gilt-light)]">★</span>}
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <p className="text-sm ms-app-muted">
                    — {t.authorName}
                    {t.authorTitle ? `, ${t.authorTitle}` : ""}
                  </p>
                  <TestimonialActions
                    testimonialId={t.id}
                    isApproved={t.isApproved}
                    isFeatured={t.isFeatured}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
