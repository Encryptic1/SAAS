import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { eq } from "@market-standard/db/query";
import { normalizeEmbedSlug, type EmbedTestimonial } from "./embed-html";

export async function loadEmbedData(slug: string): Promise<{
  collectionName: string;
  slug: string;
  showBadge: boolean;
  items: EmbedTestimonial[];
} | null> {
  const normalized = normalizeEmbedSlug(slug);

  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      collection: { name: string; slug: string; showBadge: boolean };
      testimonials: EmbedTestimonial[];
    }>(`/proof/collections/${normalized}`).catch(() => null);
    if (!data) return null;
    return {
      collectionName: data.collection.name,
      slug: data.collection.slug,
      showBadge: data.collection.showBadge,
      items: data.testimonials,
    };
  }

  const db = await getDbAsync();
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, normalized))
    .limit(1);
  if (!collection) return null;

  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.collectionId, collection.id));

  return {
    collectionName: collection.name,
    slug: collection.slug,
    showBadge: collection.showBadge,
    items: rows
      .filter((t) => t.isApproved)
      .map((t) => ({
        authorName: t.authorName,
        authorTitle: t.authorTitle,
        content: t.content,
        rating: t.rating,
      })),
  };
}
