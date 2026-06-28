import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { addActionItem } from "@/lib/postmortem-data";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { body?: string; dueAt?: string };
  if (!body.body) return NextResponse.json({ error: "body required" }, { status: 400 });
  const row = await addActionItem({ incidentId: id, ownerId, body: body.body, dueAt: body.dueAt });
  return NextResponse.json({ actionItem: row }, { status: 201 });
}
