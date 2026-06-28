import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listQueries, createQuery } from "@/lib/lens-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await listQueries(ownerId);
  return NextResponse.json({ queries: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    name?: string;
    sqlText?: string;
    databaseLabel?: string;
    tags?: string[];
    isPinned?: boolean;
  };
  if (!body.name || !body.sqlText) {
    return NextResponse.json({ error: "name and sqlText required" }, { status: 400 });
  }
  const row = await createQuery({
    ownerId,
    name: body.name,
    sqlText: body.sqlText,
    databaseLabel: body.databaseLabel,
    tags: body.tags,
    isPinned: body.isPinned,
  });
  return NextResponse.json({ query: row }, { status: 201 });
}
