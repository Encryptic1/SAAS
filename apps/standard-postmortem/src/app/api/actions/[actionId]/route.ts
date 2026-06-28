import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { updateActionItem, deleteActionItem } from "@/lib/postmortem-data";

export async function PATCH(request: Request, ctx: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { body?: string; dueAt?: string | null; completedAt?: string | null };
  const row = await updateActionItem(actionId, body);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ actionItem: row });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ actionId: string }> }) {
  const { actionId } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteActionItem(actionId);
  return NextResponse.json({ ok: true });
}
