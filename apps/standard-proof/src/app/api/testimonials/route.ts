import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { eq } from "@market-standard/db/query";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    collectionId?: string;
    slug?: string;
    authorName?: string;
    authorTitle?: string;
    content?: string;
    rating?: number;
  };

  if (!body.authorName?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Name and content required" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const row = await postGateway<typeof testimonials.$inferSelect>("/proof/testimonials", body);
    return NextResponse.json(row, { status: 201 });
  }

  const db = await getDbAsync();
  let collectionId = body.collectionId;
  if (!collectionId && body.slug) {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, body.slug))
      .limit(1);
    collectionId = collection?.id;
  }
  if (!collectionId) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const [row] = await db
    .insert(testimonials)
    .values({
      collectionId,
      authorName: body.authorName.trim(),
      authorTitle: body.authorTitle?.trim() || null,
      content: body.content.trim(),
      rating: body.rating ?? null,
      isApproved: false,
      isFeatured: false,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
