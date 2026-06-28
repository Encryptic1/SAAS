import { notFound } from "next/navigation";
import { AppSurface, PoweredByBadge } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { eq } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

interface PublicCollectionPageProps {
  params: Promise<{ slug: string }>;
}

function TestimonialList({
  items,
}: {
  items: Array<{
    id: string;
    authorName: string;
    authorTitle: string | null;
    content: string;
    rating: number | null;
  }>;
}) {
  return (
    <div className="mt-8 space-y-6">
      {items.map((t) => (
        <blockquote key={t.id} className="ms-testimonial">
          <p>&ldquo;{t.content}&rdquo;</p>
          <footer>
            — {t.authorName}
            {t.authorTitle ? `, ${t.authorTitle}` : ""}
            {t.rating ? ` · ${"★".repeat(t.rating)}` : ""}
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

export default async function PublicCollectionPage({ params }: PublicCollectionPageProps) {
  const { slug } = await params;

  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      collection: { name: string; slug: string };
      testimonials: Array<{
        id: string;
        authorName: string;
        authorTitle: string | null;
        content: string;
        rating: number | null;
      }>;
    }>(`/proof/collections/${slug}`).catch(() => null);

    if (!data) notFound();

    return (
      <AppSurface>
        <main className="ms-app-main max-w-3xl">
          <h1 className="ms-app-title">{data.collection.name}</h1>
          <p className="mt-2 ms-app-muted">Wall of Love — /{slug}</p>
          <TestimonialList items={data.testimonials} />
          <div className="ms-app-divider">
            <PoweredByBadge product="standard-proof" />
          </div>
        </main>
      </AppSurface>
    );
  }

  const db = await getDbAsync();
  const [collection] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
  if (!collection) notFound();

  const items = await db.select().from(testimonials).where(eq(testimonials.collectionId, collection.id));
  const approved = items.filter((t) => t.isApproved);

  return (
    <AppSurface>
      <main className="ms-app-main max-w-3xl">
        <h1 className="ms-app-title">{collection.name}</h1>
        <p className="mt-2 ms-app-muted">Wall of Love — /{slug}</p>
        <TestimonialList items={approved} />
        <div className="ms-app-divider">
          <PoweredByBadge product="standard-proof" />
        </div>
      </main>
    </AppSurface>
  );
}
