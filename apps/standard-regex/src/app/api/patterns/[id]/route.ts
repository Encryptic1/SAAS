import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getPattern, updatePattern, deletePattern, forkPattern } from "@/lib/regex-data";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await getPattern(id);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const row = await updatePattern(id, body);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ pattern: row });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deletePattern(id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  // Fork: POST /api/patterns/:id  { pattern, flags } -> creates a fork
  const { id } = await ctx.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as { pattern?: string; flags?: string };
  if (!body.pattern) return NextResponse.json({ error: "pattern required" }, { status: 400 });
  const fork = await forkPattern(id, ownerId, body.pattern, body.flags);
  return NextResponse.json({ fork }, { status: 201 });
}
