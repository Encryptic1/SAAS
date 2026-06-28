import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, patchGateway } from "@market-standard/db";
import { collections, testimonials } from "@market-standard/db/schema/proof";
import { and, eq } from "@market-standard/db/query";
import { getOwnerId } from "@/lib/owner";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    isApproved?: boolean;
    isFeatured?: boolean;
  };

  if (isLocalGatewayMode()) {
    const row = await patchGateway<typeof testimonials.$inferSelect>(`/proof/testimonials/${id}`, body);
    return NextResponse.json(row);
  }

  const db = await getDbAsync();
  const [existing] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [collection] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, existing.collectionId), eq(collections.ownerId, ownerId)))
    .limit(1);
  if (!collection) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [row] = await db
    .update(testimonials)
    .set({
      ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
      ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
    })
    .where(eq(testimonials.id, id))
    .returning();

  return NextResponse.json(row);
}
