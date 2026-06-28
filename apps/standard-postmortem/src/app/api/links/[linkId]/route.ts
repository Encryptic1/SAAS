import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { unlinkIncidents } from "@/lib/postmortem-data";

export async function DELETE(_request: Request, ctx: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await unlinkIncidents(linkId);
  return NextResponse.json({ ok: true });
}
