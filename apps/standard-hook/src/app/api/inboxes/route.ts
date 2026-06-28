import { NextResponse } from "next/server";
import { getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { webhookInboxes } from "@market-standard/db/schema/hook";
import { eq } from "@market-standard/db/query";
import { listOwnerInboxes } from "@/lib/hook-data";
import { getOwnerId, slugifyName } from "@/lib/owner";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listOwnerInboxes();
  return NextResponse.json(rows);
}

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
    const row = await postGateway<typeof webhookInboxes.$inferSelect>("/hook/inboxes", {
      name: body.name.trim(),
      slug,
      ownerId,
    });
    return NextResponse.json(row, { status: 201 });
  }

  const db = await getDbAsync();
  const [existing] = await db.select().from(webhookInboxes).where(eq(webhookInboxes.slug, slug)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const [row] = await db
    .insert(webhookInboxes)
    .values({
      name: body.name.trim(),
      slug,
      ownerId,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
