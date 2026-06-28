import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { markAllRead } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(ownerId);
  return NextResponse.json({ ok: true });
}
