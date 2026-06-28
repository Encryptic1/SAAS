import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getPipeline, updatePipeline, deletePipeline } from "@/lib/status-data";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await getPipeline(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const row = await updatePipeline(id, body);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ pipeline: row });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deletePipeline(id);
  return NextResponse.json({ ok: true });
}
