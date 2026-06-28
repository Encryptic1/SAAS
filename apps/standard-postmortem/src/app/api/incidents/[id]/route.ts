import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getIncident, updateIncident, deleteIncident } from "@/lib/postmortem-data";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await getIncident(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const row = await updateIncident(id, body);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ incident: row });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteIncident(id);
  return NextResponse.json({ ok: true });
}
