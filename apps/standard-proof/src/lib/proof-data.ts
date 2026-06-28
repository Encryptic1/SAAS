import type { EmbedTestimonial } from "./embed-html";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { and, eq } from "@market-standard/db/query";
import { getOwnerId } from "./owner";

export type CollectionRow = typeof collections.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;

export async function listOwnerCollections(): Promise<CollectionRow[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<CollectionRow[]>("/proof/collections");
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return [];

  const db = await getDbAsync();
  return db.select().from(collections).where(eq(collections.ownerId, ownerId));
}

export async function getOwnerCollection(id: string): Promise<{
  collection: CollectionRow;
  testimonials: TestimonialRow[];
} | null> {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ collection: CollectionRow; testimonials: TestimonialRow[] }>(
      `/proof/dashboard/collections/${id}`,
    ).catch(() => null);
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return null;

  const db = await getDbAsync();
  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.ownerId, ownerId)))
    .limit(1);
  if (!collection) return null;

  const items = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.collectionId, collection.id));

  return { collection, testimonials: items };
}

export async function getDashboardStats(): Promise<{
  collections: number;
  approved: number;
  pending: number;
  featured: number;
}> {
  if (isLocalGatewayMode()) {
    const rows = await fetchGateway<CollectionRow[]>("/proof/collections");
    let approved = 0;
    let pending = 0;
    let featured = 0;
    for (const c of rows) {
      const detail = await fetchGateway<{ testimonials: TestimonialRow[] }>(
        `/proof/dashboard/collections/${c.id}`,
      ).catch(() => null);
      if (!detail) continue;
      for (const t of detail.testimonials) {
        if (t.isApproved) approved++;
        else pending++;
        if (t.isFeatured) featured++;
      }
    }
    return { collections: rows.length, approved, pending, featured };
  }

  const ownerId = await getOwnerId();
  if (!ownerId) return { collections: 0, approved: 0, pending: 0, featured: 0 };

  const db = await getDbAsync();
  const ownerCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.ownerId, ownerId));

  let approved = 0;
  let pending = 0;
  let featured = 0;
  for (const c of ownerCollections) {
    const items = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.collectionId, c.id));
    for (const t of items) {
      if (t.isApproved) approved++;
      else pending++;
      if (t.isFeatured) featured++;
    }
  }

  return {
    collections: ownerCollections.length,
    approved,
    pending,
    featured,
  };
}

export async function getCollectionBySlug(slug: string): Promise<CollectionRow | null> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{ collection: CollectionRow }>(`/proof/collections/${slug}`).catch(
      () => null,
    );
    return data?.collection ?? null;
  }

  const db = await getDbAsync();
  const [collection] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
  return collection ?? null;
}

export function toEmbedTestimonials(rows: TestimonialRow[]): EmbedTestimonial[] {
  return rows
    .filter((t) => t.isApproved)
    .map((t) => ({
      authorName: t.authorName,
      authorTitle: t.authorTitle,
      content: t.content,
      rating: t.rating,
    }));
}
