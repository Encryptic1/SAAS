import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { getQuery, updateQuery, deleteQuery } from "@/lib/lens-data";
import type { ExplainNode } from "@market-standard/db/schema/lens";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = await getQuery(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ query: row });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getQuery(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as {
    name?: string;
    sqlText?: string;
    databaseLabel?: string;
    avgMs?: number | null;
    lastRunAt?: string | null;
    lastExplain?: ExplainNode | { plan: ExplainNode[] } | null;
    tags?: string[];
    isPinned?: boolean;
  };
  const row = await updateQuery(id, body);
  return NextResponse.json({ query: row });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await getQuery(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.ownerId !== ownerId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await deleteQuery(id);
  return NextResponse.json({ ok: true });
}
