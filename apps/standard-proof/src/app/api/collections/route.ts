import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, patchGateway, postGateway } from "@market-standard/db";
import { collections } from "@market-standard/db/schema/proof";
import { and, eq } from "@market-standard/db/query";
import { getOwnerId, slugifyName } from "@/lib/owner";

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; slug?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const slug = body.slug?.trim() || slugifyName(body.name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const row = await postGateway<typeof collections.$inferSelect>("/proof/collections", {
      name: body.name.trim(),
      slug,
      ownerId,
    });
    return NextResponse.json(row, { status: 201 });
  }

  const db = await getDbAsync();
  const [existing] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const [row] = await db
    .insert(collections)
    .values({
      name: body.name.trim(),
      slug,
      ownerId,
      plan: "free",
      showBadge: true,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PATCH(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; showBadge?: boolean; name?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Collection id required" }, { status: 400 });
  }

  if (isLocalGatewayMode()) {
    const row = await patchGateway<typeof collections.$inferSelect>(`/proof/collections/${body.id}`, {
      showBadge: body.showBadge,
      name: body.name,
    });
    return NextResponse.json(row);
  }

  const db = await getDbAsync();
  const [existing] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, body.id), eq(collections.ownerId, ownerId)))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [row] = await db
    .update(collections)
    .set({
      ...(body.showBadge !== undefined ? { showBadge: body.showBadge } : {}),
      ...(body.name ? { name: body.name.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(collections.id, body.id))
    .returning();

  return NextResponse.json(row);
}
