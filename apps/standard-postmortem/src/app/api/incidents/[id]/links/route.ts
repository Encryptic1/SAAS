import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { linkIncidents } from "@/lib/postmortem-data";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { toIncidentId?: string; similarityNote?: string };
  if (!body.toIncidentId) return NextResponse.json({ error: "toIncidentId required" }, { status: 400 });
  const link = await linkIncidents(id, body.toIncidentId, body.similarityNote);
  return NextResponse.json({ link }, { status: 201 });
}
