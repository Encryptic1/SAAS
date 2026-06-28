import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { markNotificationRead } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await markNotificationRead(id);
  return NextResponse.json({ ok: true });
}
