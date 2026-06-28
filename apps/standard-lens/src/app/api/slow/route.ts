import { NextResponse } from "next/server";
import { getOwnerId } from "@/lib/owner";
import { listSlowQueries, recordSlowQuery } from "@/lib/lens-data";

export async function GET(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
  const rows = await listSlowQueries(ownerId, limit);
  return NextResponse.json({ slowQueries: rows });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as {
    queryHash?: string;
    sqlText?: string;
    durationMs?: number;
    thresholdMs?: number;
    source?: string;
    databaseLabel?: string;
    metadata?: Record<string, unknown>;
  };
  if (!body.queryHash || !body.sqlText || body.durationMs === undefined || body.thresholdMs === undefined) {
    return NextResponse.json(
      { error: "queryHash, sqlText, durationMs, thresholdMs required" },
      { status: 400 },
    );
  }
  const row = await recordSlowQuery({
    ownerId,
    queryHash: body.queryHash,
    sqlText: body.sqlText,
    durationMs: body.durationMs,
    thresholdMs: body.thresholdMs,
    source: body.source,
    databaseLabel: body.databaseLabel,
    metadata: body.metadata,
  });
  return NextResponse.json({ slowQuery: row }, { status: 201 });
}
