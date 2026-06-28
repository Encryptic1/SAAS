import { NextResponse } from "next/server";
import { deleteGateway, getDbAsync, isLocalGatewayMode, patchGateway } from "@market-standard/db";
import { paymentLinks } from "@market-standard/db/schema/metrics";
import { eq } from "@market-standard/db/query";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; url?: string; active?: boolean };

  if (isLocalGatewayMode()) {
    const data = await patchGateway<{ link: Record<string, unknown> }>(`/metrics/payment-links/${id}`, body);
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  const updates: Partial<typeof paymentLinks.$inferInsert> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.active !== undefined) updates.active = body.active;

  const [link] = await db.update(paymentLinks).set(updates).where(eq(paymentLinks.id, id)).returning();
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ link });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (isLocalGatewayMode()) {
    const data = await deleteGateway<{ ok: boolean }>(`/metrics/payment-links/${id}`);
    return NextResponse.json(data);
  }

  const db = await getDbAsync();
  await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
  return NextResponse.json({ ok: true });
}
